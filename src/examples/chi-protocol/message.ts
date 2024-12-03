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
      {
        target: config.contractAddress,
        callData: generateDepositCallData(fallbackRecipient, config.amount),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateDepositCallData(fallbackRecipient, outputAmount),
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

export function generateDepositCallData(userAddress: Address, amount: bigint) {
  return encodeFunctionData({
    abi: [
      parseAbiItem(
        'function mintWithWETH(uint256 wethAmount, address receiver)'
      ),
    ],
    args: [amount, userAddress],
  });
}
