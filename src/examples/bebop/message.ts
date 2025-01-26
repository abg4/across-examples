import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, bebopParams } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import axios from 'axios';

export async function createCrossChainMessage(
  userAddress: Address
): Promise<CrossChainMessage> {
  const { to: swapContractAddress, data: initialCalldata } =
    await generateSwapCallData(userAddress, config.amount, config.outputToken);

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
        callData: generateApproveCallData(swapContractAddress, config.amount),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateApproveCallData(
              swapContractAddress,
              outputAmount
            ),
          };
        },
      },
      {
        // Address of the token to approve
        target: swapContractAddress,
        // Call data for the action
        callData: initialCalldata,
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: async (updatedOutputAmount: bigint) => {
          const { data: updatedCalldata } = await generateSwapCallData(
            userAddress,
            updatedOutputAmount,
            config.outputToken
          );

          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: updatedCalldata,
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

// Helper function to generate the call data for the swap function
export async function generateSwapCallData(
  userAddress: Address,
  amount: bigint,
  outputToken: Address
) {
  const quote = (
    await axios.get(
      `https://api.bebop.xyz/pmm/${bebopParams.destinationChain.name}/v3/quote`,
      {
        params: {
          buy_tokens: bebopParams.tokensAddressBuy.toString(),
          sell_tokens: outputToken,
          sell_amounts: amount.toString(),
          taker_address: bebopParams.multicall,
          receiver_address: userAddress,
          approval_type: 'Standard',
          gasless: false,
          skip_validation: true,
        },
      }
    )
  ).data;

  if (quote.error !== undefined) {
    throw new Error(quote.error);
  }

  const { to, data } = quote.tx;
  return { to, data };
}
