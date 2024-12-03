import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';

export async function createCrossChainMessage(
  address: Address
): Promise<CrossChainMessage> {
  return {
    fallbackRecipient: address,
    actions: [
      {
        target: config.outputToken,
        callData: generateApproveCallData(
          config.contractAddress,
          config.amount
        ),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateApproveCallData(
              config.contractAddress,
              outputAmount
            ),
          };
        },
      },
      {
        target: config.contractAddress,
        callData: generateDepositCallData(
          config.outputToken,
          address,
          config.amount
        ),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateDepositCallData(
              config.outputToken as `0x${string}`,
              address,
              outputAmount
            ),
          };
        },
      },
    ],
  };
}

export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

export function generateDepositCallData(
  outputToken: Address,
  userAddress: Address,
  amount: bigint
) {
  const aaveReferralCode = 0;

  return encodeFunctionData({
    abi: [
      parseAbiItem(
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
      ),
    ],
    args: [outputToken, amount, userAddress, aaveReferralCode],
  });
}
