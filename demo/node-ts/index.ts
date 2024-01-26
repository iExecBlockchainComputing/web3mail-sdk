import { IExecWeb3mail, getWeb3Provider } from '@iexec/web3mail';
import { Wallet } from 'ethers';

const test = async () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);

  const web3mail = new IExecWeb3mail(ethProvider);

  web3mail.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

test();
