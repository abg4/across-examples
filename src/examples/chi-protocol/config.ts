import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  contractAddress: '0xdf7391A10F4d6D732B1b64a943e8804105dE2e83' as Address,
  sourceChain: 42161,
  destinationChain: 1,
  inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as `0x${string}`,
  outputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
  amount: parseUnits('1', 18),
  fallbackRecipient: '',
};
