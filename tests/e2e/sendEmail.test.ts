import {
  GrantedAccess,
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecWeb3Mail } from '../../dist/web3Mail/IExecWeb3Mail';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../dist/config/config';
import {
  MAX_EXPECTED_BLOCKTIME,
  getEthProvider,
  getRandomWallet,
} from '../test-utils';

describe('web3mail.sendEmail()', () => {
  let consumerWallet: Wallet;
  let web3mail: IExecWeb3Mail;
  let dataProtector: IExecDataProtector;
  let protectedData: ProtectedDataWithSecretProps;
  let grantedAccessList: GrantedAccess;
  beforeAll(() => {
    consumerWallet = getRandomWallet();
    dataProtector = new IExecDataProtector(
      getEthProvider(consumerWallet.privateKey)
    );
    web3mail = new IExecWeb3Mail(getEthProvider(consumerWallet.privateKey));
  });

  it(
    'should successfully send email',
    async () => {
      protectedData = await dataProtector.protectData({
        // You can use your email to verify if you receive an email
        data: { email: 'example@test.com' },
        name: 'test do not use',
      });
      grantedAccessList = await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: consumerWallet.address, // consumer wallet
        numberOfAccess: 10000,
      });
      const emailContent = {
        userAddress: consumerWallet.address,
        mailObject: 'e2e mail object for test',
        mailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };

      const sendEmailResponse = await web3mail.sendEmail(emailContent);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
});
