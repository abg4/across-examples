import {
  type Address,
  type WalletClient,
  type Chain,
  encodeFunctionData,
  parseAbiItem,
} from 'viem';
import {
  config,
  MARKET_PARAMS,
  BORROW_AMOUNT,
  BASE_MULTICALL,
} from './config.js';
import { MORPHO_ABI } from './abi.js';
import { type CrossChainMessage } from '../../types/index.js';
import { type ChainId, getChainAddresses } from '@morpho-org/blue-sdk';
import { setupPrivateKeyClient } from '../../utils/viem.js';
import { createPublicClient, http } from 'viem';
import { eligibleChains } from '../../utils/constants.js';

export interface AuthorizationArgs {
  authorizer: string;
  authorized: string;
  isAuthorized: boolean;
  nonce: bigint;
  deadline: bigint;
}

const authorizationTypes = {
  Authorization: [
    { name: 'authorizer', type: 'address' },
    { name: 'authorized', type: 'address' },
    { name: 'isAuthorized', type: 'bool' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export async function createCrossChainMessage(
  userAddress: Address,
  privateKey?: string
): Promise<CrossChainMessage> {
  const { walletClient } = setupPrivateKeyClient(
    privateKey as `0x${string}`,
    config.destinationChain
  );

  const destinationChain = eligibleChains.find(
    (c: Chain) => c.id === config.destinationChain
  );

  const publicClient = createPublicClient({
    chain: destinationChain,
    transport: http(destinationChain?.rpcUrls.default.http[0] ?? ''),
  });

  // Get the nonce from Morpho contract for the authorizer
  const authorizerNonce = (await publicClient.readContract({
    address: config.contractAddress,
    abi: MORPHO_ABI,
    functionName: 'nonce',
    args: [userAddress],
  })) as bigint;

  return {
    // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
    fallbackRecipient: userAddress,
    // Actions to be executed on the destination chain
    actions: [
      // Example action to approve the contract to spend the output token
      {
        // Address of the token to approve
        target: config.outputToken,
        // Call data for the action
        callData: generateApproveCallData(
          config.contractAddress,
          config.amount
        ),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateApproveCallData(
              config.contractAddress,
              outputAmount
            ),
          };
        },
      },
      {
        // MORPHO contract address
        target: config.contractAddress,
        // Call data for the action
        callData: generateSupplyCallData(config.amount, userAddress),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateSupplyCallData(outputAmount, userAddress),
          };
        },
      },
      {
        // MORPHO contract address
        target: config.contractAddress,
        // Call data for the action
        callData: await generateAuthorizationWithSignature(
          userAddress,
          BASE_MULTICALL,
          walletClient,
          config.destinationChain,
          true,
          BigInt(authorizerNonce)
        ),
        // payable value for the call
        value: 0n,
      },
      {
        // MORPHO contract address
        target: config.contractAddress,
        // Call data for the action
        callData: generateBorrowCallData(
          BORROW_AMOUNT,
          userAddress,
          userAddress
        ),
        // payable value for the call
        value: 0n,
      },
      {
        // MORPHO contract address
        target: config.contractAddress,
        // Call data for the action
        callData: await generateAuthorizationWithSignature(
          userAddress,
          BASE_MULTICALL,
          walletClient,
          config.destinationChain,
          false,
          BigInt(authorizerNonce) + 1n
        ),
        // payable value for the call
        value: 0n,
      },
    ],
  };
}

// Helper function to generate the call data for the approve function
function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

// Helper function to generate the call data for the supplyCollateral function
function generateSupplyCallData(assets: bigint, receiver: Address) {
  const supplyCallData = encodeFunctionData({
    abi: MORPHO_ABI,
    functionName: 'supplyCollateral',
    args: [
      MARKET_PARAMS,
      assets,
      receiver,
      '0x', // empty bytes
    ],
  });

  return supplyCallData;
}

// Helper function to generate the call data for the auth function
function generateAuthorizatonCallData(
  authorization: {
    authorizer: Address;
    authorized: Address;
    isAuthorized: boolean;
    nonce: bigint;
    deadline: bigint;
  },
  signature: {
    v: number;
    r: `0x${string}`;
    s: `0x${string}`;
  }
) {
  return encodeFunctionData({
    abi: MORPHO_ABI,
    functionName: 'setAuthorizationWithSig',
    args: [
      // Authorization tuple
      [
        authorization.authorizer,
        authorization.authorized,
        authorization.isAuthorized,
        authorization.nonce,
        authorization.deadline,
      ],
      // Signature tuple
      [signature.v, signature.r, signature.s],
    ],
  });
}

// Helper function to generate the call data for the borrow function
export function generateBorrowCallData(
  assets: bigint,
  onBehalf: Address,
  receiver: Address
) {
  const depositCallData = encodeFunctionData({
    abi: MORPHO_ABI,
    functionName: 'borrow',
    args: [
      MARKET_PARAMS,
      assets,
      0n, // 0 for shares since assets value is provided
      onBehalf, // onBehalf - address owning borrow position
      receiver, // receiver - address to receive the borrowed assets
    ],
  });

  return depositCallData;
}

async function generateAuthorizationWithSignature(
  authorizer: Address,
  authorized: Address,
  walletClient: WalletClient,
  chainId: ChainId,
  isAuthorized: boolean,
  nonce: bigint
) {
  const authorization = {
    authorizer,
    authorized,
    isAuthorized,
    nonce: nonce,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  };

  const signature = await walletClient.signTypedData({
    account: walletClient.account!,
    domain: {
      chainId,
      verifyingContract: getChainAddresses(chainId).morpho,
    },
    types: authorizationTypes,
    primaryType: 'Authorization',
    message: authorization,
  });

  const { v, r, s } = splitSignature(signature);

  return generateAuthorizatonCallData(authorization, { v, r, s });
}

function splitSignature(signature: `0x${string}`) {
  if (!signature || signature.length !== 132) {
    throw new Error('Invalid signature format');
  }

  const r = signature.slice(0, 66) as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}
