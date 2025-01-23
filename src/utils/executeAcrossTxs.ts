import { logger } from '../utils/logger.js';
import {
  setupVirtualClient,
  simulateAcrossTransaction,
} from '../utils/simulate.js';
import { type Address, isAddress } from 'viem';
import { setupPrivateKeyClient } from '../utils/viem.js';
import {
  createAcrossClient,
  type ConfiguredWalletClient,
  type ExecutionProgress,
} from '@across-protocol/app-sdk';
import { eligibleChains, integratorId } from '../utils/constants.js';
import type {
  VirtualTestnetParams,
  Config,
  CreateMessageFn,
  TenderlyConfig,
} from '../types/index.js';
import { createTransactionUrl } from './helpers.js';

export async function executeAcrossTxs(
  config: Config,
  simulate: boolean,
  createCrossChainMessage: CreateMessageFn,
  tenderlyConfig: TenderlyConfig
) {
  if (simulate) {
    const {
      walletClient,
      chain,
      address: userAddress,
      privateKey,
    } = await setupVirtualClient(config.sourceChain, tenderlyConfig, false);

    const crossChainMessage = await createCrossChainMessage(
      userAddress as `0x${string}`,
      privateKey
    );

    if (!crossChainMessage) {
      logger.error('Error generating cross-chain message');
      return;
    }

    return await simulateAcrossTransaction(
      config,
      walletClient as ConfiguredWalletClient,
      chain as VirtualTestnetParams,
      crossChainMessage,
      tenderlyConfig
    );
  }

  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    logger.error('No private key. Add PRIVATE_KEY env variable');
    return;
  }
  const { walletClient, chain, userAddress } = setupPrivateKeyClient(
    privateKey,
    config.sourceChain
  );
  if (!userAddress || !walletClient || !chain) {
    logger.error('Error generating wallet client and user address.');
    return;
  }

  const recipient =
    config.fallbackRecipient && isAddress(config.fallbackRecipient)
      ? (config.fallbackRecipient as Address)
      : userAddress;
  const crossChainMessage = await createCrossChainMessage(
    recipient,
    privateKey
  );
  if (!crossChainMessage) {
    logger.error('Error creating cross-chain message.');
    return;
  }

  const acrossClient = createAcrossClient({
    integratorId, // 2-byte hex string
    chains: eligibleChains,
  });

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

  logger.info('');
  logger.info('Executing Transactions...');

  await acrossClient.executeQuote({
    walletClient,
    deposit: quote?.deposit,
    onProgress: (progress: ExecutionProgress) => {
      if (progress.step === 'approve' && progress.status === 'txSuccess') {
        const { txReceipt } = progress;
        logger.info(
          '-    Transaction hash for approval tx: ' +
            createTransactionUrl(config.sourceChain, txReceipt.transactionHash)
        );
      }

      if (progress.status === 'txSuccess' && progress.step === 'deposit') {
        const { txReceipt } = progress;
        logger.info(
          '-    Transaction hash for deposit tx: ' +
            createTransactionUrl(config.sourceChain, txReceipt.transactionHash)
        );
      }

      if (progress.step === 'fill' && progress.status === 'txSuccess') {
        const { actionSuccess, txReceipt } = progress;
        logger.info(
          '-    Transaction hash for fill tx: ' +
            createTransactionUrl(
              config.destinationChain,
              txReceipt.transactionHash
            )
        );
        if (actionSuccess) {
          logger.info(
            '-    \u2714 Destination chain contract interactions were successful!'
          );
        } else {
          logger.warn(
            '-    \u2716 Destination chain contract interactions failed!'
          );
        }
      }
    },
  });
}
