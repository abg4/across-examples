import { type Address } from 'viem';
import {
  config,
  MARKET_PARAMS,
  BORROW_AMOUNT,
  MORPHO_CONTRACTS,
  EMPTY_CALLBACK_HASH,
} from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import { type ChainId } from '@morpho-org/blue-sdk';
import { setupPrivateKeyClient } from '../../utils/viem.js';
import type { CrossChainAction } from '@across-protocol/app-sdk';
import { generateAuthorizationWithSignature } from './utils/signatureUtils.js';
import {
  generateApproveCallData,
  generateSupplyData,
  generateTransferFromCallData,
  createMulticallData,
  generateBorrowCallData,
} from './utils/encodeFunctions.js';
import { getMorphoNonce } from './utils/viem.js';

export async function createCrossChainMessage(
  userAddress: Address,
  privateKey?: string
): Promise<CrossChainMessage> {
  const { walletClient } = setupPrivateKeyClient(
    privateKey as `0x${string}`,
    config.destinationChain
  );

  const { generalAdapter, bundler3, morphoContract } =
    MORPHO_CONTRACTS[config.destinationChain as ChainId];

  const authorizerNonce = await getMorphoNonce(
    userAddress,
    morphoContract,
    config.destinationChain
  );

  const actions: CrossChainAction[] = [
    {
      // MORPHO contract address
      target: morphoContract,
      // Call data for the action
      callData: await generateAuthorizationWithSignature(
        userAddress,
        bundler3,
        walletClient,
        config.destinationChain,
        true,
        BigInt(authorizerNonce)
      ),
      // payable value for the call
      value: 0n,
    },
    {
      // Address of the token to approve
      target: MARKET_PARAMS.collateralToken,
      // Call data for the action
      callData: generateApproveCallData(generalAdapter, config.amount),
      // payable value for the call
      value: 0n,
      // Function to update the value or calldata if dependent on the output amount
      update: (outputAmount: bigint) => {
        return {
          // Updated call data for the action. If not updated, the call will fail.
          callData: generateApproveCallData(generalAdapter, outputAmount),
        };
      },
    },
    // Supply Collateral
    {
      // MORPHO contract address
      target: bundler3,
      // Call data for the action
      callData: createMulticallData([
        {
          to: generalAdapter,
          data: generateTransferFromCallData(
            MARKET_PARAMS.collateralToken,
            generalAdapter,
            config.amount
          ),
          value: 0n,
          skipRevert: true,
          callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
        },
        {
          to: generalAdapter,
          data: generateSupplyData(config.amount, userAddress),
          value: 0n,
          skipRevert: true,
          callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
        },
        {
          to: morphoContract,
          data: generateBorrowCallData(BORROW_AMOUNT, userAddress, userAddress),
          value: 0n,
          skipRevert: true,
          callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
        },
      ]),
      // payable value for the call
      value: 0n,
      // Function to update the value or calldata if dependent on the output amount
      update: (outputAmount: bigint) => {
        return {
          // Updated call data for the action. If not updated, the call will fail.
          callData: createMulticallData([
            {
              to: generalAdapter,
              data: generateTransferFromCallData(
                MARKET_PARAMS.collateralToken,
                generalAdapter,
                outputAmount
              ),
              value: 0n,
              skipRevert: true,
              callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
            },
            {
              to: generalAdapter,
              data: generateSupplyData(outputAmount, userAddress),
              value: 0n,
              skipRevert: true,
              callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
            },
            {
              to: morphoContract,
              data: generateBorrowCallData(
                BORROW_AMOUNT,
                userAddress,
                userAddress
              ),
              value: 0n,
              skipRevert: true,
              callbackHash: EMPTY_CALLBACK_HASH, // Valid bytes32
            },
          ]),
        };
      },
    },
    {
      // MORPHO contract address
      target: morphoContract,
      // Call data for the action
      callData: await generateAuthorizationWithSignature(
        userAddress,
        bundler3,
        walletClient,
        config.destinationChain,
        false,
        BigInt(authorizerNonce) + 1n
      ),
      // payable value for the call
      value: 0n,
    },
  ];

  if (!actions || actions.length === 0) {
    throw new Error('Actions array is undefined or empty');
  }

  return {
    fallbackRecipient: userAddress,
    actions,
  };
}
