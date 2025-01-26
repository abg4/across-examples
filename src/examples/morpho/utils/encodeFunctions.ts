import { type Address, encodeFunctionData } from 'viem';
import { parseAbiItem } from 'viem/utils';
import { ETH_ADAPTER_ABI, MORPHO_ABI, BUNDLER_ABI } from './abi.js';
import { MARKET_PARAMS } from '../config.js';

// Helper function to generate the call data for the approve function
export function generateApproveCallData(spender: Address, amount: bigint) {
  const approveCallData = encodeFunctionData({
    abi: [parseAbiItem('function approve(address spender, uint256 value)')],
    args: [spender, amount],
  });

  return approveCallData;
}

// Helper function to generate the call data for the supplyCollateral function
export function generateSupplyData(assets: bigint, receiver: Address) {
  const supplyCallData = encodeFunctionData({
    abi: ETH_ADAPTER_ABI,
    functionName: 'morphoSupplyCollateral',
    args: [
      MARKET_PARAMS,
      assets,
      receiver,
      '0x', // empty bytes
    ],
  });

  return supplyCallData;
}

export function generateTransferFromCallData(
  token: Address,
  receiver: Address,
  amount: bigint
) {
  const transferFromCallData = encodeFunctionData({
    abi: [
      parseAbiItem(
        'function erc20TransferFrom(address token, address receiver, uint256 amount)'
      ),
    ],
    args: [token, receiver, amount],
  });

  return transferFromCallData;
}

// Helper function to generate the call data for the borrow function
export function generateBorrowCallData(
  assets: bigint,
  onBehalf: Address,
  receiver: Address
) {
  const depositCallData = encodeFunctionData({
    abi: MORPHO_ABI,
    functionName: 'borrow',
    args: [
      MARKET_PARAMS,
      assets,
      0n, // 0 for shares since assets value is provided
      onBehalf, // onBehalf - address owning borrow position
      receiver, // receiver - address to receive the borrowed assets
    ],
  });

  return depositCallData;
}

export function createMulticallData(multicallData: any[]) {
  return encodeFunctionData({
    abi: BUNDLER_ABI,
    functionName: 'multicall',
    args: [multicallData],
  });
}
