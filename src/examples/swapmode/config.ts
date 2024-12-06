import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 8453,
  // Address of the input token on the source chain
  inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as `0x${string}`,
  // Address of the output token on the destination chain
  outputToken: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('0.1', 18),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
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
