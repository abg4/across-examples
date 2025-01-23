import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  RPC,
  VirtualTestnetParams,
  TenderlyConfig,
} from '../types/index.js';
import { eligibleChains, DEFAULT_TENDERLY_CONFIG } from './constants.js';
import { logger } from './logger.js';
import dotenv from 'dotenv';
import { appendIdToFile } from './helpers.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getTenderlyConfig() {
  return {
    TENDERLY_ACCESS_KEY:
      process.env.TENDERLY_ACCESS_KEY ||
      DEFAULT_TENDERLY_CONFIG.TENDERLY_ACCESS_KEY,
    TENDERLY_ACCOUNT:
      process.env.TENDERLY_ACCOUNT || DEFAULT_TENDERLY_CONFIG.TENDERLY_ACCOUNT,
    TENDERLY_PROJECT:
      process.env.TENDERLY_PROJECT || DEFAULT_TENDERLY_CONFIG.TENDERLY_PROJECT,
  };
}

export async function createVirtualTestnet(
  chainId: number,
  tenderlyConfig: TenderlyConfig
) {
  if (!tenderlyConfig.TENDERLY_ACCESS_KEY || !tenderlyConfig.TENDERLY_ACCOUNT) {
    logger.error('No TENDERLY_ACCESS_KEY or TENDERLY_ACCOUNT');
    return;
  }

  const timestamp = Date.now();
  const options = {
    method: 'POST',
    url: `https://api.tenderly.co/api/v1/account/${tenderlyConfig.TENDERLY_ACCOUNT}/project/${tenderlyConfig.TENDERLY_PROJECT}/vnets`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Access-Key': tenderlyConfig.TENDERLY_ACCESS_KEY,
    },
    data: {
      slug: `my-staging-testnet-${chainId}-${timestamp}`, // Use chainId and timestamp for slug
      display_name: `My Staging TestNet - Chain ${chainId} - ${timestamp}`, // Use chainId and timestamp for display_name
      fork_config: { network_id: chainId, block_number: 'latest' },
      virtual_network_config: { chain_config: { chain_id: chainId } },
      sync_state_config: { enabled: false },
      explorer_page_config: {
        enabled: true,
        verification_visibility: 'src',
      },
    },
  };

  try {
    const { data } = await axios.request(options);

    const chainInfo = eligibleChains.find((chain) => chain.id === chainId);
    if (!chainInfo) {
      logger.error(`No chain info found for chain ${chainId}`);
      return;
    }

    const extractedData: VirtualTestnetParams = {
      id: data.id,
      chainId: data.virtual_network_config.chain_config.chain_id,
      rpcUrl: data.rpcs.find((rpc: RPC) => rpc.name === 'Admin RPC')?.url, // URL for "Admin RPC"
      blockExplorerUrl: data.rpcs.find((rpc: RPC) => rpc.name === 'Public RPC')
        ?.url, // URL for "Public RPC"
      project: tenderlyConfig.TENDERLY_ACCOUNT,
      tenderlyName: chainInfo.tenderlyName,
      testnet: chainInfo.testnet,
    };

    logger.info('Created Virtual network with id: ' + extractedData.id);

    appendIdToFile(extractedData.id.toString());

    return extractedData;
  } catch (error) {
    logger.error('Error setting up virtual testnet: ' + error);
    return undefined;
  }
}

async function deleteVirtualTestnet(
  vnetId: string,
  tenderlyConfig: TenderlyConfig
) {
  if (!tenderlyConfig.TENDERLY_ACCESS_KEY) {
    logger.error('No TENDERLY_ACCESS_KEY');
    return;
  }
  const options = {
    method: 'DELETE',
    url: `https://api.tenderly.co/api/v1/account/${tenderlyConfig.TENDERLY_ACCOUNT}/project/${tenderlyConfig.TENDERLY_PROJECT}/vnets/${vnetId}`,
    headers: {
      Accept: 'application/json',
      'X-Access-Key': tenderlyConfig.TENDERLY_ACCESS_KEY,
    },
  };

  try {
    const { data } = await axios.request(options);
    logger.info('- Testnet deleted with id: ' + vnetId);
    return data;
  } catch (error) {
    logger.error('Error deleting virtual testnet' + error);
  }
}

export async function deleteTestnets(tenderlyConfig: TenderlyConfig) {
  try {
    const filePath = path.join(__dirname, '..', '..', 'testnet-ids.json'); // Adjusted path to root
    const data = await fs.readFile(filePath, 'utf-8');
    let testnetIds: string[] = JSON.parse(data);

    for (const id of testnetIds) {
      await deleteVirtualTestnet(id, tenderlyConfig);
    }

    // Clear the array after processing
    testnetIds = [];

    // Write the updated array back to the file
    await fs.writeFile(filePath, JSON.stringify(testnetIds, null, 2), 'utf-8');
  } catch (error) {
    logger.error(`Error processing testnet IDs: ${error}`);
  }
}

export function generateVirtualConfig(virtualChain: VirtualTestnetParams) {
  if (!virtualChain.rpcUrl || !virtualChain.blockExplorerUrl) {
    logger.error('Unable to create virtual config');
    return;
  }

  return {
    id: virtualChain.chainId,
    name: `Virtual ${virtualChain.chainId}`,
    nativeCurrency: { name: 'VETH', symbol: 'vETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: [virtualChain.rpcUrl], // Use non-null assertion
      },
    },
    blockExplorers: {
      default: {
        name: 'Tenderly Explorer',
        url: virtualChain.blockExplorerUrl,
      },
    },
    testnet: virtualChain.testnet,
  };
}
