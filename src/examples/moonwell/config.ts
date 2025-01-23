import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 8453,
  // Token ddress of the input token on the source chain
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('5', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};
