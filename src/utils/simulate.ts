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
import {
  createTenderlyUrl,
  createTransactionUrl,
  logTransactionSuccess,
} from '../utils/helpers.js';

dotenv.config();

const undefinedChain = {
  publicClient: undefined,
  walletClient: undefined,
  chain: undefined,
  address: undefined,
  privateKey: undefined,
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
    } = await setupVirtualClient(config.destinationChain, tenderlyConfig, true);

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
      virtualOriginChain,
      tenderlyConfig
    );

    await acrossClient.executeQuote({
      walletClient: userWalletClient,
      deposit: updatedDeposit,
      onProgress: async (progress: ExecutionProgress) => {
        if (progress.step === 'approve' && progress.status === 'txSuccess') {
          // if approving an ERC20, you have access to the approval receipt
          const { txReceipt } = progress;
          const transactionUrl = createTransactionUrl(
            config.sourceChain,
            txReceipt.transactionHash
          );
          logTransactionSuccess(
            `- Sucessfully approved spoke pool on origin chain`,
            transactionUrl
          );
        }

        if (progress.step === 'deposit' && progress.status === 'txSuccess') {
          // once deposit is successful you have access to depositId and the receipt
          const { txReceipt } = progress;

          const transactionUrl = createTransactionUrl(
            config.sourceChain,
            txReceipt.transactionHash
          );
          logTransactionSuccess(
            `Sucessfully completed deposit on origin chain`,
            transactionUrl
          );

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
            virtualDestinationChain as VirtualTestnetParams,
            tenderlyConfig
          );
        }

        if (progress.step === 'fill' && progress.status === 'txSuccess') {
          // if the fill is successful, you have access the following data
          const { actionSuccess } = progress;
          // actionSuccess is a boolean flag, telling us if your cross chain messages were successful
          logger.info('Result of cross chain transaction:');
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
  tenderlyConfig: TenderlyConfig,
  isRelayer: boolean
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

    const { walletClient, privateKey } = createWalletClientWithAccount(
      virtualChainConfig,
      isRelayer
    );
    if (!walletClient?.account) {
      logger.error('Failed to create wallet client');
      return undefinedChain;
    }
    logger.info('-  User wallet created successfully');

    return {
      publicClient,
      walletClient,
      chain: virtualChain,
      address: walletClient.account.address,
      privateKey,
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
  _destinationSpokePool: Address,
  chainParams: VirtualTestnetParams,
  tenderlyConfig: TenderlyConfig
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

    await fundWallet(
      userWalletClient,
      fundingAmount,
      chainParams,
      tenderlyConfig
    );

    await fundErc20(
      userWalletClient,
      deposit.inputToken,
      deposit.inputAmount,
      chainParams,
      tenderlyConfig
    );

    await approveSpokePool(
      userWalletClient,
      deposit.inputToken,
      deposit.inputAmount,
      originSpokePool,
      chainParams,
      tenderlyConfig
    );

    // Setting relayer with funding to prevent unnecessary Tenderly calls
    // Uncomment if you want Tenderly to fund relayer
    // await fundWallet(
    //   relayerWalletClient,
    //   fundingAmount,
    //   chainParams,
    //   tenderlyConfig
    // );

    // Setting relayer with funding to prevent unnecessaryTenderly calls
    // Uncomment if you want Tenderly to fund relayer
    // await fundErc20(
    //   relayerWalletClient,
    //   deposit.outputToken,
    //   deposit.outputAmount,
    //   chainParams,
    //   tenderlyConfig
    // );

    // Setting relayer with approval to prevent unnecessary Tenderly calls
    // Uncomment if you want Tenderly to set approvals for relayer
    // await approveSpokePool(
    //   relayerWalletClient,
    //   deposit.outputToken,
    //   deposit.outputAmount,
    //   _destinationSpokePool,
    //   chainParams,
    //   tenderlyConfig
    // );
  } catch {
    logger.error('Error funding and approving accounts');
  }
}

export async function fundWallet(
  walletClient: WalletClient,
  amount: bigint,
  chain: VirtualTestnetParams,
  tenderlyConfig: TenderlyConfig
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
    tenderlyConfig.TENDERLY_PROJECT,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logTransactionSuccess(`User wallet funding successful`, tenderlyUrl);
}

async function fundErc20(
  walletClient: WalletClient,
  token: Address,
  amount: bigint,
  chain: VirtualTestnetParams,
  tenderlyConfig: TenderlyConfig
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
    tenderlyConfig.TENDERLY_PROJECT,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logTransactionSuccess(`User ERC20 wallet funding successful`, tenderlyUrl);
}

async function approveSpokePool(
  walletClient: WalletClient,
  token: Address,
  amount: bigint,
  spokePool: Address,
  chain: VirtualTestnetParams,
  tenderlyConfig: TenderlyConfig
) {
  const txHash = await approveTx(walletClient, token, amount, spokePool);
  if (!txHash) {
    logger.error('Unable to approve spoke pool');
    return;
  }
  const tenderlyUrl = createTenderlyUrl(
    chain.project,
    tenderlyConfig.TENDERLY_PROJECT,
    chain.id.toString(),
    chain.tenderlyName,
    txHash
  );
  logTransactionSuccess(
    `Wallet approved spoke pool for user wallet`,
    tenderlyUrl
  );
}
