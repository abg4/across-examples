import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  contractAddress: '' as Address,
  sourceChain: 42161,
  destinationChain: 8453,
  inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as `0x${string}`,
  outputToken: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  amount: parseUnits('0.1', 18),
  fallbackRecipient: '',
};

export const networkConfig = {
  zapApi: 'https://zap-api.kyberswap.com/base/api/v1/in/route',
  networkZapName: 'DEX_SWAPMODEV3',
  poolAddress: '0x74cb6260Be6F31965C239Df6d6Ef2Ac2B5D4f020',
  ticks: {
    LOWER: -194904,
    UPPER: -193903,
  },
};
