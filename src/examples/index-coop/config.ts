import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';
import { type QuoteToken } from '@indexcoop/flash-mint-sdk';

const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0xF06A59348712a11e7823Ad8BFc45c59f7EAFCc60' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 8453,
  // Address of the input token on the source chain
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  // Address of the output token on the destination chain
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('100', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
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

// Slippage set for the Index quote
const slippage = 0.1;
// Buffer to prevent failed tx on destination chain
const bufferPercentage = 98.5;

export {
  config,
  indexInputToken,
  indexOutputToken,
  slippage,
  bufferPercentage,
};
