import { IExecWeb3Mail } from '@iexec/web3mail';
import { getSignerFromPrivateKey } from 'iexec/utils';
const main = async () => {
  const ethProvider = getSignerFromPrivateKey(
    'https://bellecour.iex.ec',
    '100fa1624ee42e114f70e9a7a0212ac18c529aecee6a08ceb3b7562959447d4f'
  );
  const web3mail = new IExecWeb3Mail(ethProvider);
  console.log(await web3mail.fetchMyContacts());
};

main();
