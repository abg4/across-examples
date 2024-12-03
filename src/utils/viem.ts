import { type ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { WalletClient, Address, PublicClient, Chain } from 'viem';
import {
  encodeFunctionData,
  parseAbiItem,
  createWalletClient,
  http,
} from 'viem';
import { spokePoolAbi } from './abi.js';
import { logger } from './logger.js';
import { repaymentChain, eligibleChains } from './constants.js';
import { type Deposit } from '@across-protocol/app-sdk';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { type VirtualTestnetParams } from '../types/index.js';
import { createTenderlyUrl } from '../utils/helpers.js';

export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

export async function approveTx(
  walletClient: WalletClient,
  token: Address,
  amount: bigint,
  approvalAddress: Address
) {
  if (!walletClient?.account) {
    logger.error('No relayer wallet client');
    return;
  }
  const approveTx = await walletClient.request({
    method: 'eth_sendTransaction',
    params: [
      // transaction object
      {
        from: walletClient.account.address,
        to: token,
        gas: '0x0',
        gasPrice: '0x0',
        value: '0x0',
        data: generateApproveCallData(approvalAddress, amount),
      },
    ],
  });
  return approveTx;
}

export async function spokePoolFillTx(
  deposit: Deposit,
  publicClient: PublicClient,
  relayerClient: WalletClient,
  spokePoolAddress: Address,
  chain: VirtualTestnetParams
) {
  if (!relayerClient.account) {
    logger.error('Relayer account is undefined');
    return;
  }
  const relayData = {
    depositor: deposit.depositor as Address,
    recipient: deposit.recipient as Address,
    exclusiveRelayer: deposit.exclusiveRelayer as Address,
    inputToken: deposit.inputToken as Address,
    outputToken: deposit.outputToken as Address,
    inputAmount: BigInt(deposit.inputAmount),
    outputAmount: BigInt(deposit.outputAmount),
    originChainId: BigInt(deposit.originChainId),
    depositId: deposit.depositId,
    fillDeadline: deposit.fillDeadline,
    exclusivityDeadline: deposit.exclusivityDeadline,
    message: deposit.message,
  };
  const repaymentChainId = repaymentChain;

  const { request } = await publicClient.simulateContract({
    address: spokePoolAddress,
    abi: spokePoolAbi,
    functionName: 'fillV3Relay',
    account: relayerClient.account.address,
    args: [relayData, repaymentChainId],
  });

  const txHash = await relayerClient.writeContract(request);

  const tenderlyUrl = createTenderlyUrl(
    chain.project,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );

  logger.info(`- Sucessfully filled deposit:`);
  logger.info(`-    ${tenderlyUrl}`);

  return txHash;
}

export function createWalletClientWithAccount(
  config: Chain
): ConfiguredWalletClient {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  if (!account) {
    throw new Error('Failed to create account');
  }
  return createWalletClient({
    account,
    chain: config,
    transport: http(config.rpcUrls.default.http[0]),
  });
}

export function setupPrivateKeyClient(
  privateKey: `0x${string}`,
  originChainId: number
) {
  const account = privateKeyToAccount(privateKey);

  const chain = eligibleChains.find(
    (chain: Chain) => chain.id === originChainId
  );

  const client = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  return {
    walletClient: client,
    chain,
    userAddress: client.account.address,
  };
}
