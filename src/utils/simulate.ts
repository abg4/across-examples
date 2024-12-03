import { fundingAmount, EMPTY_ADDRESS } from './constants.js';
import { generateVirtualConfig, createVirtualTestnet } from './tenderly.js';
import { logger } from './logger.js';
import {
  approveTx,
  createWalletClientWithAccount,
  spokePoolFillTx,
} from './viem.js';
import type {
  TSetBalanceRpc,
  TSetErc20BalanceRpc,
} from '../tenderly.config.js';
import {
  createPublicClient,
  http,
  toHex,
  type Address,
  type WalletClient,
} from 'viem';
import type {
  VirtualTestnetParams,
  QuoteDeposit,
  SetupResult,
  Config,
  CrossChainMessage,
  TenderlyConfig,
} from '../types/index.js';
import { setupAcrossClient } from './across.js';
import {
  type ConfiguredWalletClient,
  type ExecutionProgress,
  type Quote,
  getDepositFromLogs,
} from '@across-protocol/app-sdk';
import dotenv from 'dotenv';
import { createTenderlyUrl } from '../utils/helpers.js';

dotenv.config();

const undefinedChain = {
  publicClient: undefined,
  walletClient: undefined,
  chain: undefined,
  address: undefined,
};

export async function simulateAcrossTransaction(
  config: Config,
  userWalletClient: ConfiguredWalletClient,
  virtualOriginChain: VirtualTestnetParams,
  crossChainMessage: CrossChainMessage,
  tenderlyConfig: TenderlyConfig
): Promise<{ destinationTxSuccess: boolean; quote: Quote } | undefined> {
  if (!userWalletClient) {
    logger.error('Unable to generate wallet client for user');
    return undefined;
  }

  try {
    const {
      walletClient: relayerWalletClient,
      chain: virtualDestinationChain,
      publicClient,
    } = await setupVirtualClient(config.destinationChain, tenderlyConfig);

    if (!publicClient || !relayerWalletClient || !virtualDestinationChain) {
      logger.error('Failed to setup virtual testnet.');
      return;
    }

    const acrossClient = await setupAcrossClient(
      virtualOriginChain,
      virtualDestinationChain as VirtualTestnetParams,
      tenderlyConfig
    );

    if (!acrossClient) {
      logger.error('Setup failed, returning early.');
      return undefined;
    }

    const route = {
      originChainId: config.sourceChain,
      destinationChainId: config.destinationChain,
      inputToken: config.inputToken as Address,
      outputToken: config.outputToken as Address,
    };

    const quote = await acrossClient.getQuote({
      route,
      inputAmount: config.amount,
      crossChainMessage: crossChainMessage,
    });

    // Updating because simulation will fail if exclusive relayer is set.
    const updatedDeposit = {
      ...quote.deposit,
      exclusiveRelayer: EMPTY_ADDRESS as Address, // Change exclusiveRelayer to "0x"
      exclusivityDeadline: 0,
    };

    await handleFundingAndApprovals(
      userWalletClient,
      relayerWalletClient,
      updatedDeposit,
      updatedDeposit.spokePoolAddress,
      updatedDeposit.destinationSpokePoolAddress,
      virtualOriginChain
    );

    await acrossClient.executeQuote({
      walletClient: userWalletClient,
      deposit: updatedDeposit,
      onProgress: async (progress: ExecutionProgress) => {
        if (
          progress.step === 'approve' &&
          progress.status === 'simulationSuccess'
        ) {
          // if approving an ERC20, you have access to the approval receipt
          const { txRequest } = progress;
          logger.log('-    Transaction hash for approval tx: ', txRequest);
        }

        if (progress.status === 'txSuccess' && progress.step === 'deposit') {
          // once deposit is successful you have access to depositId and the receipt
          const { txReceipt } = progress;

          const rawDeposit = getDepositFromLogs({
            originChainId: config.sourceChain,
            receipt: txReceipt,
          });

          if (!rawDeposit) {
            logger.error('Error retrieving deposit.');
            return;
          }
          await spokePoolFillTx(
            rawDeposit,
            publicClient,
            relayerWalletClient,
            quote.deposit.destinationSpokePoolAddress,
            virtualDestinationChain as VirtualTestnetParams
          );
        }

        if (progress.step === 'fill' && progress.status === 'txSuccess') {
          // if the fill is successful, you have access the following data
          const { actionSuccess } = progress;
          // actionSuccess is a boolean flag, telling us if your cross chain messages were successful
          if (actionSuccess) {
            logger.info(
              '-    \u2714 Destination chain contract interactions were successful!'
            );
            return; // Exit the onProgress function
          } else {
            logger.error(
              '-    \u2716 Destination chain contract interactions failed!'
            );
            return;
          }
        }
      },
    });
  } catch (error) {
    logger.log('error', error);
  }
}

export async function setupVirtualClient(
  chainId: number,
  tenderlyConfig: TenderlyConfig
): Promise<SetupResult> {
  try {
    logger.info('');
    logger.info('Setting up test environment...');
    const virtualChain: VirtualTestnetParams | undefined =
      await createVirtualTestnet(chainId, tenderlyConfig);

    if (!virtualChain) {
      logger.error('-  Unable to setup virtual testnet');
      return undefinedChain;
    }

    logger.info('-  Virtual Network created successfully');

    const virtualChainConfig = generateVirtualConfig(virtualChain);

    if (!virtualChainConfig) {
      logger.error('Unable to setup virtual testnet config');
      return undefinedChain;
    }

    const publicClient = createPublicClient({
      chain: virtualChainConfig,
      transport: http(virtualChainConfig.rpcUrls.default.http[0]),
    });

    const walletClient = createWalletClientWithAccount(virtualChainConfig);
    if (!walletClient?.account) {
      logger.error('Failed to create wallet client');
      return undefinedChain;
    }
    logger.info('-  Wallet created successfully');

    return {
      publicClient,
      walletClient,
      chain: virtualChain,
      address: walletClient.account.address,
    };
  } catch (error) {
    logger.log('error creating virtual testnet: ', error);
    return undefinedChain;
  }
}

export async function handleFundingAndApprovals(
  userWalletClient: WalletClient,
  relayerWalletClient: WalletClient,
  deposit: QuoteDeposit,
  originSpokePool: Address,
  destinationSpokePool: Address,
  chainParams: VirtualTestnetParams
) {
  try {
    if (!userWalletClient.account || !relayerWalletClient.account) {
      logger.error(
        'Unable to retrieve user or relayer wallet client for funding and approvals'
      );
      return;
    }
    logger.info('');
    logger.info('Funding wallets and approvals...');

    await fundWallet(userWalletClient, fundingAmount, chainParams);
    await fundWallet(relayerWalletClient, fundingAmount, chainParams);

    await fundErc20(
      userWalletClient,
      deposit.inputToken,
      deposit.inputAmount,
      chainParams
    );
    await fundErc20(
      relayerWalletClient,
      deposit.outputToken,
      deposit.outputAmount,
      chainParams
    );

    await approveSpokePool(
      userWalletClient,
      deposit.inputToken,
      deposit.inputAmount,
      originSpokePool,
      chainParams
    );
    await approveSpokePool(
      relayerWalletClient,
      deposit.outputToken,
      deposit.outputAmount,
      destinationSpokePool,
      chainParams
    );
  } catch {
    logger.error('Error funding and approving accounts');
  }
}

async function fundWallet(
  walletClient: WalletClient,
  amount: bigint,
  chain: VirtualTestnetParams
) {
  if (!walletClient.account?.address) {
    logger.error('Unable to retrieve wallet client to fund wallet');
    return;
  }
  const txHash = await walletClient.request<TSetBalanceRpc>({
    method: 'tenderly_setBalance',
    params: [[walletClient.account?.address], toHex(amount)],
  });

  const tenderlyUrl = createTenderlyUrl(
    chain.project,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logger.info(`- Wallet funding successful:`);
  logger.info(`-    ${tenderlyUrl}`);
  logger.info(``);
}

async function fundErc20(
  walletClient: WalletClient,
  token: Address,
  amount: bigint,
  chain: VirtualTestnetParams
) {
  if (!walletClient.account?.address) {
    logger.error('Unable to retrieve wallet client to fund wallet');
    return;
  }
  const txHash = await walletClient.request<TSetErc20BalanceRpc>({
    method: 'tenderly_setErc20Balance',
    params: [token, walletClient.account?.address, toHex(amount)],
  });
  const tenderlyUrl = createTenderlyUrl(
    chain.project,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logger.info(`- ERC20 wallet funding successful:`);
  logger.info(`-    ${tenderlyUrl}`);
  logger.info(``);
}

async function approveSpokePool(
  walletClient: WalletClient,
  token: Address,
  amount: bigint,
  spokePool: Address,
  chain: VirtualTestnetParams
) {
  const txHash = await approveTx(walletClient, token, amount, spokePool);
  if (!txHash) {
    logger.error('Unable to approve spoke pool');
    return;
  }
  const tenderlyUrl = createTenderlyUrl(
    chain.project,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logger.info(`- Wallet approved spoke pool:`);
  logger.info(`-    ${tenderlyUrl}`);
  logger.info(``);
}
