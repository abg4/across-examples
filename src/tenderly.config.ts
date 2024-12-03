import { type Hex } from 'viem';

export type TSetBalanceRpc = {
  method: 'tenderly_setBalance';
  Parameters: [addresses: Hex[], value: Hex];
  ReturnType: Hex;
};

export type TSetErc20BalanceRpc = {
  method: 'tenderly_setErc20Balance';
  Parameters: [erc20: Hex, to: Hex, value: Hex];
  ReturnType: Hex;
};
