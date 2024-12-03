import { arbitrum, base, mainnet, polygon, linea } from 'viem/chains';
import { parseUnits } from 'viem';
import type { TenderlyConfig } from '../types/index.js';

export const DEFAULT_TENDERLY_CONFIG: TenderlyConfig = {
  TENDERLY_ACCESS_KEY: 'GjptgtTTOeEVLCXijfFyIpmLFJRKHJgx',
  TENDERLY_ACCOUNT: 'againes',
  TENDERLY_PROJECT: 'project',
};

export const eligibleChains = [
  { ...arbitrum, tenderlyName: 'arbitrum' },
  { ...base, tenderlyName: 'base' },
  { ...mainnet, tenderlyName: 'mainnet' },
  { ...polygon, tenderlyName: 'polygon' },
  { ...linea, tenderlyName: 'linea' },
];

export const fundingAmount = parseUnits('1000', 18);

export const repaymentChain = 8453n;

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export const integratorId = '0x003a';
