import { IExecDataProtector } from '@iexec/dataprotector';
import dotenv from 'dotenv';
import { NULL_ADDRESS, getSignerFromPrivateKey } from 'iexec/utils';
import { SMS_URL, WEB3_MAIL_DAPP_ADDRESS } from './config.js';
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
      smsURL: { scone: SMS_URL },
    },
  });

  const { address } = await dataProtector.protectData({
    data: {
      email: email,
    },
    name: 'my e-mail',
  });
  const grantedAccess = await dataProtector.grantAccess({
    authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
    protectedData: address,
    authorizedUser: NULL_ADDRESS,
  });
  console.log('Data is created!');
  console.log('address: ', address);
};

main();
