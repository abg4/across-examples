import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0x1d9619E10086FdC1065B114298384aAe3F680CC0' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 1,
  // Token ddress of the input token on the source chain
  inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('0.4', 18),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};

export const payArgs = {
  projectId: BigInt(762),
  amount: config.amount,
  token: '0x000000000000000000000000000000000000EEEe' as `0x${string}`,
  minReturnedTokens: BigInt(0),
  preferClaimedTokens: false as boolean,
  memo: '',
  metadata: '0x00' as `0x${string}`,
};
