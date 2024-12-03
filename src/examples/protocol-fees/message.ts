import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, feeConfig } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';

export async function createCrossChainMessage(
  address: Address
): Promise<CrossChainMessage> {
  // Calculate initial fee amount based on input amount
  const initialFeeAmount =
    (config.amount * BigInt(Math.floor(feeConfig.feePercentage * 10000))) /
    10000n;
  const initialRecipientAmount = config.amount - initialFeeAmount;

  return {
    fallbackRecipient: address,
    actions: [
      {
        target: config.outputToken,
        callData: generateTransferCallData(address, initialRecipientAmount),
        value: 0n,
        update: (outputAmount: bigint) => {
          // Calculate fee amount based on output amount
          const feeAmount =
            (outputAmount *
              BigInt(Math.floor(feeConfig.feePercentage * 10000))) /
            10000n;
          const recipientAmount = outputAmount - feeAmount;

          return {
            callData: generateTransferCallData(address, recipientAmount),
          };
        },
      },
      {
        target: config.outputToken,
        callData: generateTransferCallData(
          feeConfig.feeRecipient,
          initialFeeAmount
        ),
        value: 0n,
        update: (outputAmount: bigint) => {
          const feeAmount =
            (outputAmount *
              BigInt(Math.floor(feeConfig.feePercentage * 10000))) /
            10000n;
          return {
            callData: generateTransferCallData(
              feeConfig.feeRecipient,
              feeAmount
            ),
          };
        },
      },
    ],
  };
}

export function generateTransferCallData(spender: Address, amount: bigint) {
  const transferCallData = encodeFunctionData({
    abi: [parseAbiItem('function transfer(address to, uint256 amount)')],
    args: [spender, amount],
  });

  return transferCallData;
}
