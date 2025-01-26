import { parseUnits, type Address } from 'viem';
import type { Config } from '../../types/index.js';

export const config: Config = {
  // Address of the contract to interact with on the destination chain
  contractAddress: '0x6BFd8137e702540E7A42B74178A4a49Ba43920C4' as Address,
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

export const MORPHO_CONTRACTS = {
  1: {
    bundler3: '0x6566194141eefa99Af43Bb5Aa71460Ca2Dc90245' as Address,
    generalAdapter: '0x44D08C8ecfBAb871350BC1b4F0F6d2632f186418' as Address,
    morphoContract: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address,
  },
  8453: {
    bundler3: '0x6BFd8137e702540E7A42B74178A4a49Ba43920C4' as Address,
    generalAdapter: '0x8aD36FFc31341ce575F39906bB92df78003c74E2' as Address,
    morphoContract: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address,
  },
};

export const BORROW_AMOUNT = parseUnits('0.001', 18);

export const EMPTY_CALLBACK_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
