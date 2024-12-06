import {
  type Address,
  type Chain,
  encodeFunctionData,
  parseAbiItem,
  parseUnits,
} from 'viem';
import {
  config,
  indexInputToken,
  indexOutputToken,
  slippage,
  bufferPercentage,
} from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import {
  FlashMintQuoteProvider,
  ZeroExSwapQuoteProvider,
  type QuoteToken,
} from '@indexcoop/flash-mint-sdk';
import { eligibleChains } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';

export async function createCrossChainMessage(
  address: Address
): Promise<CrossChainMessage | undefined> {
  const indexQuote = await getIndexQuote(
    config.amount,
    indexInputToken,
    indexOutputToken,
    config.destinationChain
  );

  if (!indexQuote) {
    logger.error('Unable to retrieve index quote');
    return;
  }
  const flashMintContract = indexQuote.tx.to as `0x${string}`;
  const flashMintData = indexQuote.tx.data as `0x${string}`;

  if (!flashMintData || !flashMintContract) {
    logger.error('Unable to retrieve flashMintData');
    return;
  }

  return {
    fallbackRecipient: address,
    actions: [
      createApproveAction(flashMintContract, config.amount),
      createFlashMintAction(
        flashMintContract,
        flashMintData,
        indexInputToken,
        indexOutputToken
      ),
      // TODO: Add approval for CCIP
      // createApproveAction(ccipContract, config.amount),
      // TODO: Create ccipSend action
      // createCcipSendAction(),
    ],
  };
}

function createApproveAction(flashMintContract: Address, amount: bigint) {
  return {
    target: config.outputToken,
    callData: generateApproveCallData(flashMintContract, amount),
    value: 0n,
    update: (outputAmount: bigint) => ({
      callData: generateApproveCallData(flashMintContract, outputAmount),
    }),
  };
}

function createFlashMintAction(
  flashMintContract: Address,
  flashMintData: `0x${string}`,
  inputToken: QuoteToken,
  outputToken: QuoteToken
) {
  return {
    target: flashMintContract,
    callData: flashMintData,
    value: 0n,
    update: async (outputAmount: bigint) => {
      const updatedIndexQuote = await getIndexQuote(
        outputAmount,
        inputToken,
        outputToken,
        config.destinationChain
      );

      if (!updatedIndexQuote?.tx?.data) {
        logger.error('Unable to retrieve valid updated index quote');
        return { callData: undefined, value: undefined };
      }

      return {
        to: updatedIndexQuote.tx.to,
        callData: updatedIndexQuote.tx.data as `0x${string}`,
      };
    },
  };
}

export async function getIndexQuote(
  amount: bigint,
  inputToken: QuoteToken,
  outputToken: QuoteToken,
  destinationChain: number
) {
  const mainnetRpc = eligibleChains.find(
    (chain: Chain) => chain.id === destinationChain
  )?.rpcUrls.default.http[0];

  if (!mainnetRpc) {
    logger.error('Unable to get mainnet rpc.');
    return undefined;
  }

  const acrossAmount = calculateAcrossAmount(amount, inputToken);
  const quote = await getQuoteFromProvider(
    mainnetRpc,
    acrossAmount,
    inputToken,
    outputToken
  );

  return quote ? { quote, tx: quote.tx } : undefined;
}

export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

async function getQuoteFromProvider(
  mainnetRpc: string,
  amount: string,
  inputToken: QuoteToken,
  outputToken: QuoteToken
) {
  const zeroexSwapQuoteProvider = new ZeroExSwapQuoteProvider();
  const quoteProvider = new FlashMintQuoteProvider(
    mainnetRpc,
    zeroexSwapQuoteProvider
  );

  try {
    return await quoteProvider.getQuote({
      isMinting: true,
      inputToken,
      outputToken,
      inputTokenAmount: '0',
      indexTokenAmount: amount,
      slippage,
    });
  } catch (error) {
    logger.error('Failed to retrieve Index quote:', error);
    return undefined;
  }
}

const BUFFER_BPS = Math.floor(bufferPercentage * 100);

function calculateAcrossAmount(amount: bigint, inputToken: QuoteToken): string {
  if (inputToken.symbol !== 'USDC') {
    return amount.toString();
  }

  // Scale the amount and apply buffer in one operation
  const scaledAmount = (amount * BigInt(BUFFER_BPS)) / 10000n;

  // Convert from USDC (6 decimals) to 18 decimals
  return parseUnits(scaledAmount.toString(), 12).toString();
}
