import { executeAcrossTxs } from '../../utils/executeAcrossTxs.js';
import { config } from './config.js';
import { createCrossChainMessage } from './message.js';
import type { TenderlyConfig } from '../../types/index.js';
export async function executeAcrossTxsWrapper(
  simulate: boolean,
  tenderlyConfig: TenderlyConfig
) {
  await executeAcrossTxs(
    config,
    simulate,
    createCrossChainMessage,
    tenderlyConfig
  );
}
