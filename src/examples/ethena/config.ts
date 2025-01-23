import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Curve USDe-USDC contract address on destination chain
  contractAddress: '0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 1,
  // Token ddress of the input token on the source chain
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('50', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};

// Curve parameters for the quote and swap
export const curveParams = {
  i: 1n, // Index value for the coin to send
  j: 0n, // Index valie of the coin to recieve
};
