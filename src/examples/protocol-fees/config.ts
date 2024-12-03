import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address,
  sourceChain: 42161,
  destinationChain: 8453,
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  amount: parseUnits('10', 6),
  fallbackRecipient: '',
};

export const feeConfig = {
  feeRecipient: '0xB8034521BB1a343D556e5005680B3F17FFc74BeD' as Address,
  feePercentage: 0.1,
};
