import dotenv from 'dotenv';
import yargs from 'yargs';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from './utils/logger.js';
import { deleteTestnets, getTenderlyConfig } from './utils/tenderly.js';
import type { TenderlyConfig } from './types/index.js';

dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure yargs to parse the command-line arguments
const argv = yargs(process.argv.slice(2))
  .option('project', {
    alias: 'p',
    description: 'Specify the project name',
    type: 'string',
  })
  .option('simulate', {
    // Added simulate option
    description: 'Run in simulation mode',
    type: 'boolean',
    default: true, // Default value set to true
  }).argv;

// Function to handle the project command
async function handleProjectCommand(
  projectName: string | undefined,
  simulate: boolean,
  tenderlyConfig: TenderlyConfig
) {
  if (!projectName) {
    logger.error(
      'No project specified. Use --project <name> to specify a project.'
    );
    return;
  }
  logger.info(
    `- Simulate mode set to ${simulate}. Use --simulate false to execute transactions.`
  );

  const indexPath = path.join(__dirname, 'examples', projectName, 'index.js');
  logger.info(`- Running project from: ${indexPath}`);

  try {
    // Use dynamic import to load the module
    const module = await import(indexPath);

    if (module.executeAcrossTxsWrapper) {
      await module.executeAcrossTxsWrapper(simulate, tenderlyConfig);
    }
  } catch (error) {
    logger.error(`Failed to load project: ${error}`);
  }
}

// Main function to execute the command
async function main() {
  const args = await argv;

  logger.info('Running clean up and setup...');

  const tenderlyConfig = getTenderlyConfig();
  logger.info('- Tenderly Configuration added');

  await deleteTestnets(tenderlyConfig);

  handleProjectCommand(args.project, args.simulate, tenderlyConfig);
}

// Run the main function
main();
