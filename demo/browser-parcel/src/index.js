import { IExecWeb3mail } from '@iexec/web3mail';

const main = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const web3mail = new IExecWeb3mail(window.ethereum);
};

main();
