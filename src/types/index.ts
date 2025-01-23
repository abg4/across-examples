import type { Hex, Address, PublicClient, Chain } from 'viem';
import type {
  CrossChainAction,
  ConfiguredWalletClient,
} from '@across-protocol/app-sdk';

export interface RPC {
  url: string;
  name: string;
}

export interface RpcUrls {
  [chainId: number]: string; // Maps chain IDs to their corresponding RPC URLs
}

export interface VirtualTestnetParams {
  id: number;
  chainId: number;
  rpcUrl?: string; // Optional in case the RPC is not found
  blockExplorerUrl?: string; // Optional in case the RPC is not found
  project: string;
  tenderlyName: string;
  testnet: boolean;
}

export interface QuoteDeposit {
  inputAmount: bigint;
  outputAmount: bigint;
  recipient: Address;
  message: Hex;
  quoteTimestamp: number;
  exclusiveRelayer: Address;
  exclusivityDeadline: number;
  spokePoolAddress: Address;
  destinationSpokePoolAddress: Address;
  originChainId: number;
  destinationChainId: number;
  inputToken: Address;
  outputToken: Address;
  isNative?: boolean;
}

export type CreateMessageFn = (
  recipient: Address,
  privateKey?: string
) => Promise<CrossChainMessage | undefined>;

export interface CrossChainMessage {
  actions: CrossChainAction[];
  fallbackRecipient: Address;
}

export interface SetupResult {
  walletClient: ConfiguredWalletClient | undefined;
  chain: VirtualTestnetParams | Chain | undefined;
  address: Address | undefined;
  publicClient?: PublicClient | undefined;
  privateKey: `0x${string}` | undefined;
}

export interface Config {
  contractAddress: Address;
  sourceChain: number;
  destinationChain: number;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
  amount: bigint;
  fallbackRecipient: string;
}

export interface TenderlyConfig {
  TENDERLY_ACCESS_KEY: string;
  TENDERLY_ACCOUNT: string;
  TENDERLY_PROJECT: string;
}

export type EligibleChain = Chain & {
  testnet: boolean;
  tenderlyName: string;
};
