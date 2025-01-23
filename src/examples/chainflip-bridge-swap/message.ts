import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import { chainflipConfig } from './config.js';

export async function createCrossChainMessage(
  address: Address
): Promise<CrossChainMessage> {
  return {
    // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
    fallbackRecipient: address,
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
        // Address of the token to approve
        target: config.contractAddress,
        // Call data for the action
        callData: generateSwapCallData(config.amount, address),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateSwapCallData(outputAmount, address),
          };
        },
      },
    ],
  };
}

// Helper function to generate the call data for the approve function
export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

export function generateSwapCallData(
  amount: bigint,
  recipientAddress: Address
) {
  const swapCallData = encodeFunctionData({
    abi: [
      parseAbiItem(
        'function xSwapToken(uint32 dstChain, bytes dstAddress, uint32 dstToken, address srcToken, uint256 amount, bytes cfParameters)'
      ),
    ],
    args: [
      chainflipConfig.dstChainId,
      recipientAddress,
      chainflipConfig.dstToken,
      config.outputToken as `0x${string}`,
      amount,
      '0x',
    ],
  });

  return swapCallData;
}
