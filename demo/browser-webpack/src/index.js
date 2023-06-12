import { IExecWeb3Mail } from '@iexec/web3mail';

const test = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const web3Mail = new IExecWeb3Mail(window.ethereum);

  web3Mail.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

document.getElementById('test-button').addEventListener('click', test);
