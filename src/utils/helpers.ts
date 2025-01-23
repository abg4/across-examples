import fs from 'fs';
import { logger } from './logger.js';
import { eligibleChains } from './constants.js';
import type { Chain } from 'viem';

export function appendIdToFile(newId: string) {
  const filePath = './testnet-ids.json';

  // Read the existing file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the file doesn't exist, create it with the new ID
        const initialData = [newId];
        fs.writeFile(
          filePath,
          JSON.stringify(initialData, null, 2),
          (writeErr) => {
            if (writeErr) {
              logger.error('Error writing file:', writeErr);
            }
          }
        );
      } else {
        logger.error('Error reading file:', err);
      }
      return;
    }

    // Parse the existing JSON data
    let ids;
    try {
      ids = JSON.parse(data);
    } catch (parseErr) {
      logger.error('Error parsing JSON:', parseErr);
      return;
    }

    // Append the new ID
    ids.push(newId);

    // Write the updated JSON back to the file
    fs.writeFile(filePath, JSON.stringify(ids, null, 2), (writeErr) => {
      if (writeErr) {
        logger.error('Error writing file:', writeErr);
      }
    });
  });
}

export function createTenderlyUrl(
  project: string,
  projectName: string,
  projectId: string,
  chain: string,
  txId: string
): string {
  return `https://dashboard.tenderly.co/${project}/${projectName}/testnet/${projectId}/tx/${chain}/${txId}`;
}

export function createTransactionUrl(chainId: number, transactionHash: string) {
  // Find the chain info from eligibleChains using chainId
  const chainInfo = eligibleChains.find((chain: Chain) => chain.id === chainId);

  if (!chainInfo || !chainInfo.blockExplorers) {
    logger.warn(`No block explorer found for chain ID ${chainId}`);
    return '';
  }

  // Get the block explorer URL
  let blockExplorerUrl = chainInfo.blockExplorers.default.url;

  // Ensure the block explorer URL ends with a slash
  if (!blockExplorerUrl.endsWith('/')) {
    blockExplorerUrl += '/';
  }

  // Append the transaction hash to create the full URL
  return `${blockExplorerUrl}tx/${transactionHash}`;
}

export function logTransactionSuccess(message: string, url: string) {
  logger.info(`- ${message}:`);
  logger.info(`-    ${url}`);
  logger.info('');
}
