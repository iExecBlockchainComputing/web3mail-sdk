import { IExecWeb3Mail } from '@iexec/web3mail';

const main = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const web3Mail = new IExecWeb3Mail(window.ethereum);
};

main();
