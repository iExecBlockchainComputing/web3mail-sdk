import { IExecWeb3Mail } from '@iexec/web3mail';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { Wallet } from 'ethers';

const test = async () => {
  const ethProvider = getSignerFromPrivateKey(
    'https://bellecour.iex.ec',
    Wallet.createRandom().privateKey
  );

  const web3Mail = new IExecWeb3Mail(ethProvider);

  web3Mail.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

test();