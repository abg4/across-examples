import { type Address, type WalletClient, encodeFunctionData } from 'viem';
import { type ChainId, getChainAddresses } from '@morpho-org/blue-sdk';
import { MORPHO_ABI } from './abi.js';
import { authorizationTypes } from './types.js';

// Helper function to generate the call data for the auth function
function generateAuthorizatonCallData(
  authorization: {
    authorizer: Address;
    authorized: Address;
    isAuthorized: boolean;
    nonce: bigint;
    deadline: bigint;
  },
  signature: {
    v: number;
    r: `0x${string}`;
    s: `0x${string}`;
  }
) {
  return encodeFunctionData({
    abi: MORPHO_ABI,
    functionName: 'setAuthorizationWithSig',
    args: [
      // Authorization tuple
      [
        authorization.authorizer,
        authorization.authorized,
        authorization.isAuthorized,
        authorization.nonce,
        authorization.deadline,
      ],
      // Signature tuple
      [signature.v, signature.r, signature.s],
    ],
  });
}

export async function generateAuthorizationWithSignature(
  authorizer: Address,
  authorized: Address,
  walletClient: WalletClient,
  chainId: ChainId,
  isAuthorized: boolean,
  nonce: bigint
) {
  const authorization = {
    authorizer,
    authorized,
    isAuthorized,
    nonce: nonce,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  };

  const signature = await walletClient.signTypedData({
    account: walletClient.account!,
    domain: {
      chainId,
      verifyingContract: getChainAddresses(chainId).morpho,
    },
    types: authorizationTypes,
    primaryType: 'Authorization',
    message: authorization,
  });

  const { v, r, s } = splitSignature(signature);

  return generateAuthorizatonCallData(authorization, { v, r, s });
}

function splitSignature(signature: `0x${string}`) {
  if (!signature || signature.length !== 132) {
    throw new Error('Invalid signature format');
  }

  const r = signature.slice(0, 66) as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}
