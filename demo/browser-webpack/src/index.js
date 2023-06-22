import { IExecWeb3mail } from '@iexec/web3mail';

const test = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const web3mail = new IExecWeb3mail(window.ethereum);

  web3mail.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

document.getElementById('test-button').addEventListener('click', test);
