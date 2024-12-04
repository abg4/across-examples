import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, depositParams } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';

export async function createCrossChainMessage(
  fallbackRecipient: Address
): Promise<CrossChainMessage> {
  return {
    fallbackRecipient: fallbackRecipient,
    actions: [
      // Approve the output token
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
      // Deposit the output token to the ICHI Vault
      {
        target: config.contractAddress,
        callData: generateDepositCallData(
          config.outputToken,
          config.amount,
          fallbackRecipient
        ),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateDepositCallData(
              config.outputToken as `0x${string}`,
              outputAmount,
              fallbackRecipient
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
  token: Address,
  amount: bigint,
  spender: Address
) {
  const depositCallData = encodeFunctionData({
    abi: [
      parseAbiItem(
        'function forwardDepositToICHIVault(address vault,address vaultDeployer,address token,uint256 amount,uint256 minimumProceeds,address to)'
      ),
    ],
    args: [
      depositParams.vault,
      depositParams.vaultDeployer,
      token,
      amount,
      BigInt(depositParams.minimumProceeds),
      spender,
    ],
  });

  return depositCallData;
}
