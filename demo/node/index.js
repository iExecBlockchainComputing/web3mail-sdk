import { IExecWeb3Mail, getWeb3Provider } from '@iexec/web3mail';
import { Wallet } from 'ethers';

const test = async () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);

  const web3Mail = new IExecWeb3Mail(ethProvider);

  web3Mail.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

test();
