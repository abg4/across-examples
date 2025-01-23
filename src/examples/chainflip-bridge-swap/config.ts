import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0x79001a5e762f3bEFC8e5871b42F6734e00498920' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 8453,
  // Chain ID of the destination blockchain network
  destinationChain: 42161,
  // Token ddress of the input token on the source chain
  inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('15', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};

export const chainflipConfig = {
  network: 'mainnet',
  providerName: 'arbitrum',
  srcChainId: 4,
  dstChainId: 1,
  dstToken: 1,
  cfParameters: '0x',
};
