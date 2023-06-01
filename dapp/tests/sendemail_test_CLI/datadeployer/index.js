import { IExecDataProtector } from '@iexec/dataprotector';
import dotenv from 'dotenv';
import { NULL_ADDRESS, getSignerFromPrivateKey } from 'iexec/utils';
const main = async () => {
  dotenv.config();
  const private_Key = process.env.PRIVATE_KEY;
  const email = process.env.EMAIL_ADDRESS;
  const ethProvider = getSignerFromPrivateKey(
    'https://bellecour.iex.ec',
    private_Key
  );

  const dataProtector = new IExecDataProtector(ethProvider, {
    iexecOptions: {
      smsURL: { scone: 'https://sms.scone-debug.v8-bellecour.iex.ec' },
    },
  });

  const { address } = await dataProtector.protectData({
    data: {
      email: email,
    },
    name: 'my e-mail',
  });
  const grantedAccess = await dataProtector.grantAccess({
    authorizedApp: '0x3ef531f670B12dc21490Fff2f81c20A59e17d254',
    protectedData: address,
    authorizedUser: NULL_ADDRESS,
  });
  console.log('Data is created!');
  console.log('address: ', address);
};

main();
