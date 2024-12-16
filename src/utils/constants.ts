import {
  arbitrum,
  base,
  mainnet,
  polygon,
  linea,
  sepolia,
  baseSepolia,
} from 'viem/chains';
import { parseUnits } from 'viem';
import type { TenderlyConfig, EligibleChain } from '../types/index.js';

export const DEFAULT_TENDERLY_CONFIG: TenderlyConfig = {
  TENDERLY_ACCESS_KEY: 'GjptgtTTOeEVLCXijfFyIpmLFJRKHJgx',
  TENDERLY_ACCOUNT: 'againes',
  TENDERLY_PROJECT: 'project',
};

export const eligibleChains: EligibleChain[] = [
  { ...arbitrum, testnet: false, tenderlyName: 'arbitrum' },
  { ...base, testnet: false, tenderlyName: 'base' },
  { ...mainnet, testnet: false, tenderlyName: 'mainnet' },
  { ...polygon, testnet: false, tenderlyName: 'polygon' },
  { ...linea, testnet: false, tenderlyName: 'linea' },
  { ...sepolia, testnet: true, tenderlyName: 'sepolia' },
  { ...baseSepolia, testnet: true, tenderlyName: 'baseSepolia' },
];

export const fundingAmount = parseUnits('1000', 18);

export const repaymentChain = 8453n;

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export const integratorId = '0x003a';
