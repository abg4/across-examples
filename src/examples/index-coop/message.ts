import {
  type Address,
  type Chain,
  encodeFunctionData,
  parseAbiItem,
} from 'viem';
import {
  config,
  indexInputToken,
  indexOutputToken,
  slippage,
  bufferPercentage,
} from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import { BigNumber } from '@ethersproject/bignumber';
import {
  FlashMintQuoteProvider,
  ZeroExSwapQuoteProvider,
  type QuoteToken,
} from '@indexcoop/flash-mint-sdk';
import { eligibleChains } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';

export async function createCrossChainMessage(
  fallbackRecipient: Address
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
  const { tx } = indexQuote;
  const flashMintContract = tx.to as `0x${string}`;
  const flashMintData = tx.data;

  if (!flashMintData || !flashMintContract) {
    logger.error('Unable to retrieve flashMintData');
    return;
  }

  return {
    fallbackRecipient: fallbackRecipient,
    actions: [
      {
        target: config.outputToken,
        callData: generateApproveCallData(flashMintContract, config.amount),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateApproveCallData(flashMintContract, outputAmount),
          };
        },
      },
      {
        target: flashMintContract,
        callData: flashMintData as `0x${string}`,
        value: 0n,
        update: async (outputAmount: bigint) => {
          const updatedIndexQuote = await getIndexQuote(
            outputAmount,
            indexInputToken,
            indexOutputToken,
            config.destinationChain
          );

          if (!updatedIndexQuote) {
            logger.error('Unable to retrieve index quote');
            return { callData: undefined, value: undefined };
          }
          const { tx } = updatedIndexQuote;
          const flashMintData = tx.data;
          if (!flashMintData) {
            logger.error('Unable to retrieve index flashMintData');
            return { callData: undefined, value: undefined };
          }

          return {
            to: tx.to,
            callData: flashMintData as `0x${string}`,
          };
        },
      },
    ],
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
  // Use the 0x swap quote provider configured to your needs e.g. custom base url -
  // or provide your own adapter implementing the `SwapQuoteProvider` interface
  const zeroexSwapQuoteProvider = new ZeroExSwapQuoteProvider();
  const quoteProvider = new FlashMintQuoteProvider(
    mainnetRpc,
    zeroexSwapQuoteProvider
  );

  let acrossAmount: BigNumber = BigNumber.from(amount);
  if (indexInputToken.symbol === 'USDC') {
    acrossAmount = BigNumber.from(amount).mul(BigNumber.from(10).pow(12));

    // Calculate slippage amount and reduce acrossAmount
    const buffer = BigNumber.from(Math.floor(bufferPercentage * 100)); // Convert to BigNumber
    acrossAmount = acrossAmount.mul(buffer).div(BigNumber.from(10000)); // Adjust division for decimal
  }

  const quote = await quoteProvider.getQuote({
    isMinting: true,
    inputToken: inputToken,
    outputToken: outputToken,
    inputTokenAmount: '0',
    indexTokenAmount: BigNumber.from(acrossAmount).toString(),
    slippage,
  });

  if (!quote) {
    logger.error('Failed to retrieve Index quote.');
    return undefined;
  }

  const { tx } = quote;
  return { quote, tx };
}

export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

export function generateDepositCallData(
  outputToken: Address,
  userAddress: Address,
  amount: bigint
) {
  const aaveReferralCode = 0;

  return encodeFunctionData({
    abi: [
      parseAbiItem(
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
      ),
    ],
    args: [outputToken, amount, userAddress, aaveReferralCode],
  });
}
