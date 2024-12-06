import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, payArgs } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';

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
        callData: generateUnwrapCallData(config.amount),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateUnwrapCallData(outputAmount),
          };
        },
      },
      {
        // Address of the token to approve
        target: config.contractAddress,
        // Call data for the action
        callData: generateContributionCallData(config.amount, address),
        // payable value for the call
        value: config.amount,
        // Function to update the value or calldata if dependent on the output amount
        update: (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: generateContributionCallData(outputAmount, address),
            value: outputAmount,
          };
        },
      },
    ],
  };
}

// Helper function to generate the call data for the approve function
export function generateUnwrapCallData(amount: bigint) {
  const unwrapCallData = encodeFunctionData({
    abi: [parseAbiItem('function withdraw(uint256 amount)')],
    args: [amount],
  });

  return unwrapCallData;
}

export function generateContributionCallData(
  amount: bigint,
  beneficiary: Address
) {
  const contributionCallData = encodeFunctionData({
    abi: [
      parseAbiItem(
        'function pay(uint256 _projectId,uint256 _amount,address _token,address _beneficiary,uint256 _minReturnedTokens,bool _preferClaimedTokens,string _memo,bytes _metadata)'
      ),
    ],
    args: [
      payArgs.projectId,
      amount,
      payArgs.token,
      beneficiary,
      payArgs.minReturnedTokens,
      payArgs.preferClaimedTokens,
      payArgs.memo,
      payArgs.metadata,
    ],
  });

  return contributionCallData;
}
