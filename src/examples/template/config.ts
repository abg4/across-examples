import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 1,
  // Chain ID of the destination blockchain network
  destinationChain: 10,
  // Token ddress of the input token on the source chain
  inputToken: '' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('1', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};
