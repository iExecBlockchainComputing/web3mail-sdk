import { getSignerFromPrivateKey } from 'iexec/utils';
import { Wallet } from 'ethers';

export const getRandomWallet = () => Wallet.createRandom();

export const getEthProvider = (privateKey) =>
  getSignerFromPrivateKey('bellecour', privateKey);

export const MAX_EXPECTED_BLOCKTIME = 20_000;
