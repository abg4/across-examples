import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';

export async function createCrossChainMessage(
  fallbackRecipient: Address
): Promise<CrossChainMessage> {
  return {
    fallbackRecipient: fallbackRecipient,
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
