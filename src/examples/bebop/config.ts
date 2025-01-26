import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '' as Address, // not used because we use address returned by bebop API
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 8453,
  // Token ddress of the input token on the source chain
  inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('0.005', 18),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};

export const bebopParams = {
  destinationChain: {
    chainId: 8453,
    name: 'base',
  },
  tokensAddressBuy: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  multicall: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
};
