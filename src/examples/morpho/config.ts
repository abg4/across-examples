import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address,
  // Chain ID of the source blockchain network
  sourceChain: 42161,
  // Chain ID of the destination blockchain network
  destinationChain: 8453,
  // Token ddress of the input token on the source chain
  inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  // Token address of the output token on the destination chain
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  // Amount of input tokens to deposit
  amount: parseUnits('10', 6),
  // Address to receive tokens if the primary transaction fails. If left empty, the depositor address is used.
  fallbackRecipient: '',
};

export const MARKET_PARAMS = {
  loanToken: '0x4200000000000000000000000000000000000006' as Address,
  collateralToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  oracle: '0xD09048c8B568Dbf5f189302beA26c9edABFC4858' as Address,
  irm: '0x46415998764C29aB2a25CbeA6254146D50D22687' as Address,
  lltv: 860000000000000000n,
};

export const BORROW_AMOUNT = parseUnits('0.001', 18);

export const BASE_MULTICALL = '0x924a9f036260DdD5808007E1AA95f08eD08aA569';
