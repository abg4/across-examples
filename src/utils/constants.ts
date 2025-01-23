import {
  arbitrum,
  base,
  mainnet,
  polygon,
  linea,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
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
  { ...optimism, testnet: false, tenderlyName: 'optimistic' },
  { ...base, testnet: false, tenderlyName: 'base' },
  { ...mainnet, testnet: false, tenderlyName: 'mainnet' },
  { ...polygon, testnet: false, tenderlyName: 'polygon' },
  { ...linea, testnet: false, tenderlyName: 'linea' },
  { ...sepolia, testnet: true, tenderlyName: 'sepolia' },
  { ...baseSepolia, testnet: true, tenderlyName: 'baseSepolia' },
  { ...arbitrumSepolia, testnet: true, tenderlyName: 'arbitrumSepolia' },
  { ...optimismSepolia, testnet: true, tenderlyName: 'optimismSepolia' },
];

export const fundingAmount = parseUnits('1000', 18);

export const repaymentChain = 8453n;

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export const integratorId = '0x003a';

export const relayerAddressTestnet =
  '0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D';

export const relayerAddressMainnet =
  '0x07aE8551Be970cB1cCa11Dd7a11F47Ae82e70E67';
