import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  contractAddress: '0x57C9d919AEA56171506cfb62B60ce76be0A079DF' as Address,
  sourceChain: 42161,
  destinationChain: 59144,
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  outputToken: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff' as `0x${string}`,
  amount: parseUnits('15', 6),
  fallbackRecipient: '',
};

export const depositParams = {
  vault: '0x92ccb773da4f3974c941974bDb978bAd7efa7744' as Address,
  vaultDeployer: '0x75178e0a2829B73E3AE4C21eE64F4B684085392a' as Address,
  minimumProceeds: '50000000000000000000',
};
