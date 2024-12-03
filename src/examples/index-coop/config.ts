import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';
import { type QuoteToken } from '@indexcoop/flash-mint-sdk';

const config: Config = {
  contractAddress: '0xF06A59348712a11e7823Ad8BFc45c59f7EAFCc60' as Address,
  sourceChain: 42161,
  destinationChain: 8453,
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  amount: parseUnits('10', 6),
  fallbackRecipient: '',
};

// Input/output token should be of type QuoteToken with the following properties
const indexInputToken: QuoteToken = {
  symbol: 'USDC',
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const indexOutputToken: QuoteToken = {
  symbol: 'icUSD',
  decimals: 18,
  address: '0xF06A59348712a11e7823Ad8BFc45c59f7EAFCc60',
};

const slippage = 0.1;

const bufferPercentage = 98; // Buffer as a decimal percentage

export {
  config,
  indexInputToken,
  indexOutputToken,
  slippage,
  bufferPercentage,
};