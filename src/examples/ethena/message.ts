import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, curveParams } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import { eligibleChains } from '../../utils/constants.js';
import { createPublicClient, http } from 'viem';

export async function createCrossChainMessage(
  userAddress: Address
): Promise<CrossChainMessage> {
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
        // Address of the Curve contract
        target: config.contractAddress,
        // Call data for the action
        callData: await generateExchangeCallData(
          curveParams.i,
          curveParams.j,
          config.amount,
          userAddress
        ),
        // payable value for the call
        value: 0n,
        // Function to update the value or calldata if dependent on the output amount
        update: async (outputAmount: bigint) => {
          return {
            // Updated call data for the action. If not updated, the call will fail.
            callData: await generateExchangeCallData(
              curveParams.i,
              curveParams.j,
              outputAmount,
              userAddress
            ),
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

export async function generateExchangeCallData(
  i: bigint,
  j: bigint,
  _dx: bigint,
  _receiver: Address
) {
  const chain = eligibleChains.find((c) => c.id === config.destinationChain);
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
  });

  const minDy = await publicClient.readContract({
    abi: [
      parseAbiItem(
        'function get_dy(int128 i,int128 j,uint256 dx) external view returns (uint256)'
      ),
    ],
    address: config.contractAddress,
    functionName: 'get_dy',
    args: [i, j, _dx],
  });

  // Calculate minDy minus 0.03%
  const adjustedMinDy = (minDy * 9997n) / 10000n;

  const exchangeCallData = encodeFunctionData({
    abi: [
      parseAbiItem(
        'function exchange(int128 i,int128 j,uint256 _dx,uint256 _min_dy,address _receiver)'
      ),
    ],
    args: [i, j, _dx, adjustedMinDy, _receiver],
  });

  return exchangeCallData;
}
