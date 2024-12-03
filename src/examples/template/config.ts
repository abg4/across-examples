import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  contractAddress: '' as Address,
  sourceChain: 1,
  destinationChain: 1,
  inputToken: '' as `0x${string}`,
  outputToken: '' as `0x${string}`,
  amount: parseUnits('1', 6),
  fallbackRecipient: '',
};
