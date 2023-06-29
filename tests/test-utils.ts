import { Wallet } from 'ethers';

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 20_000;
