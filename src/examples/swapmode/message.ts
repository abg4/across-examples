import fetch from 'node-fetch';
import { type Address, encodeFunctionData, parseAbiItem } from 'viem';
import { config, networkConfig } from './config.js';
import { type CrossChainMessage } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { URLSearchParams } from 'url';

export async function createCrossChainMessage(
  address: Address
): Promise<CrossChainMessage> {
  const initialZapQuote = await getZapQuote(address, config.amount.toString());

  return {
    fallbackRecipient: address,
    actions: [
      {
        target: config.outputToken,
        callData: generateApproveCallData(
          initialZapQuote.routerAddress,
          config.amount
        ),
        value: 0n,
        update: (outputAmount: bigint) => {
          return {
            callData: generateApproveCallData(
              initialZapQuote.routerAddress,
              outputAmount
            ),
          };
        },
      },
      {
        target: initialZapQuote.routerAddress,
        callData: initialZapQuote.callData,
        value: 0n,
        update: async (outputAmount: bigint) => {
          const updatedZapQuote = await getZapQuote(
            address,
            outputAmount.toString()
          );

          return {
            callData: updatedZapQuote.callData,
          };
        },
      },
    ],
  };
}

function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

export async function getZapQuote(account: Address, amount: string) {
  // First get the route
  const routeParams = new URLSearchParams({
    dex: networkConfig.networkZapName,
    'pool.id': networkConfig.poolAddress,
    'position.tickLower': networkConfig.ticks.LOWER.toString(),
    'position.tickUpper': networkConfig.ticks.UPPER.toString(),
    tokensIn: config.outputToken,
    amountsIn: amount,
    slippage: '100',
  });

  const routeResponse = await fetch(`${networkConfig.zapApi}?${routeParams}`, {
    headers: {
      'x-client-id': 'Swapmode',
    },
  });

  if (!routeResponse.ok) {
    logger.error(`Route fetch failed: ${routeResponse.statusText}`);
    return;
  }

  const routeData = await routeResponse.json();

  // Immediately build the transaction with the route data
  const currentTime = Math.floor(Date.now() / 1000);
  const deadline = currentTime + 20 * 60; // 20 minutes from now

  const buildParams = {
    sender: account,
    recipient: account,
    route: routeData.data.route,
    deadline: deadline,
    source: 'Swapmode',
    permits: {},
  };

  const buildResponse = await fetch(`${networkConfig.zapApi}/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': 'Swapmode',
    },
    body: JSON.stringify(buildParams),
  });

  if (!buildResponse.ok) {
    logger.error(`Route fetch failed: ${buildResponse.statusText}`);
    return;
  }

  const buildData = await buildResponse.json();

  if (!buildData.data) {
    logger.error(`No data returned from build endpoint`);
    return;
  }

  return buildData.data;
}
