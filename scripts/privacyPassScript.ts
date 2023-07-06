import { IExecWeb3mail, getWeb3Provider } from '../dist/index.js';
import { Wallet } from 'ethers';

const main = async () => {
  const web3mail = new IExecWeb3mail(
    getWeb3Provider(Wallet.createRandom().privateKey)
  );

  const NumberOfRegistrations = (
    await web3mail.fetchUserContacts({
      userAddress: '0x00456DA695859Df49483574Ec0fE5F9940720d9b',
    })
  ).length;

  console.log('📮 The Number of Registration is : ', NumberOfRegistrations);
};

main().catch(console.error);
