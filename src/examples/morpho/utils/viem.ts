import { type Address, type Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { MORPHO_ABI } from './abi.js';
import { type ChainId } from '@morpho-org/blue-sdk';
import { eligibleChains } from '../../../utils/constants.js';

export async function getMorphoNonce(
  userAddress: Address,
  morphoContract: Address,
  destinationChainId: ChainId
): Promise<bigint> {
  const destinationChain = eligibleChains.find(
    (c: Chain) => c.id === destinationChainId
  );

  if (!destinationChain) {
    throw new Error('Destination chain not found');
  }

  const publicClient = createPublicClient({
    chain: destinationChain,
    transport: http(destinationChain.rpcUrls.default.http[0]),
  });

  // Get the nonce from Morpho contract for the authorizer
  const authorizerNonce = (await publicClient.readContract({
    address: morphoContract,
    abi: MORPHO_ABI,
    functionName: 'nonce',
    args: [userAddress],
  })) as bigint;

  return authorizerNonce;
}
