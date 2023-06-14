import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecWeb3mail, getWeb3Provider } from '../../dist/index';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../dist/config/config';
import { MAX_EXPECTED_BLOCKTIME, getRandomWallet } from '../test-utils';

describe('web3mail.sendEmail()', () => {
  let consumerWallet: Wallet;
  let providerWallet: Wallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;

  beforeAll(async () => {
    providerWallet = getRandomWallet();
    consumerWallet = getRandomWallet();
    dataProtector = new IExecDataProtector(
      getWeb3Provider(providerWallet.privateKey)
    );
    web3mail = new IExecWeb3mail(getWeb3Provider(consumerWallet.privateKey));
  });

  it(
    'should successfully send email',
    async () => {
      const protectedData: ProtectedDataWithSecretProps =
        await dataProtector.protectData({
          // You can use your email to verify if you receive an email
          data: { email: 'example@test.com' },
          name: 'test do not use',
        });
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: consumerWallet.address, // consumer wallet
        numberOfAccess: 1,
      });
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if the protected data is not valid',
    async () => {
      const protectedData: ProtectedDataWithSecretProps =
        await dataProtector.protectData({
          data: { foo: 'bar' },
          name: 'test do not use',
        });
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'ProtectedData is not valid'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if there is no dataset order found',
    async () => {
      const protectedData: ProtectedDataWithSecretProps =
        await dataProtector.protectData({
          data: { email: 'example@test.com' },
          name: 'test do not use',
        });

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'Dataset order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if there is no App order found',
    async () => {
      jest
        .spyOn(web3mail, 'sendEmail')
        .mockRejectedValue(new Error('App order not found'));

      const protectedData: ProtectedDataWithSecretProps =
        await dataProtector.protectData({
          data: { email: 'example@test.com' },
          name: 'test do not use',
        });

      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: consumerWallet.address, // consumer wallet
        numberOfAccess: 1,
      });

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrowError(
        'App order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if there is no App order found',
    async () => {
      jest
        .spyOn(web3mail, 'sendEmail')
        .mockRejectedValue(new Error('Workerpool order not found'));

      const protectedData: ProtectedDataWithSecretProps =
        await dataProtector.protectData({
          data: { email: 'example@test.com' },
          name: 'test do not use',
        });

      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: consumerWallet.address, // consumer wallet
        numberOfAccess: 1,
      });

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrowError(
        'Workerpool order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
});
