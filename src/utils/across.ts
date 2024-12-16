import { createAcrossClient } from '@across-protocol/app-sdk';
import type {
  RpcUrls,
  VirtualTestnetParams,
  TenderlyConfig,
} from '../types/index.js';
import { eligibleChains, integratorId } from './constants.js';
import { logger } from './logger.js';

export async function setupAcrossClient(
  virtualSourceChain: VirtualTestnetParams,
  virtualDestinationChain: VirtualTestnetParams,
  tenderlyConfig: TenderlyConfig
) {
  const rpcUrls = createRpcUrls(virtualSourceChain, virtualDestinationChain);
  if (!rpcUrls) {
    logger.error('Unable to setup vitual testnest rpc configs');
    return;
  }

  const useTestnet =
    virtualSourceChain.testnet || virtualDestinationChain.testnet;

  const acrossClient = generateAcrossClient(
    rpcUrls,
    tenderlyConfig,
    useTestnet
  );
  logger.info('-  Across client successful');

  return acrossClient;
}

export function generateAcrossClient(
  rpcUrls: RpcUrls,
  tenderlyConfig: TenderlyConfig,
  useTestnet: boolean
) {
  return createAcrossClient({
    integratorId, // 2-byte hex string
    chains: eligibleChains,
    useTestnet,
    rpcUrls,
    tenderly: {
      simOnError: true,
      accessKey: tenderlyConfig.TENDERLY_ACCESS_KEY,
      accountSlug: tenderlyConfig.TENDERLY_ACCOUNT,
      projectSlug: tenderlyConfig.TENDERLY_PROJECT,
    },
  });
}

export function createRpcUrls(
  virtualOrigin: VirtualTestnetParams,
  virtualDestination: VirtualTestnetParams
): RpcUrls | undefined {
  if (!virtualOrigin.rpcUrl || !virtualDestination.rpcUrl) {
    logger.error('Unable to create rpc urls.');
    return undefined;
  }
  return {
    [virtualOrigin.chainId]: virtualOrigin.rpcUrl,
    [virtualDestination.chainId]: virtualDestination.rpcUrl,
  };
}
