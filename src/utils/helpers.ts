import fs from 'fs';
import { logger } from './logger.js';

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
  projectId: string,
  chain: string,
  txId: string
): string {
  return `https://dashboard.tenderly.co/${project}/project/testnet/${projectId}/tx/${chain}/${txId}`;
}
