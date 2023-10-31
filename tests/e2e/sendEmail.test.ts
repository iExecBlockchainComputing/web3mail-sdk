import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
  getWeb3Provider as dataprotectorGetWeb3Provider,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../dist/config/config';
import { IExecWeb3mail, getWeb3Provider } from '../../dist/index';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getRandomWallet,
  sleep,
} from '../test-utils';

describe('web3mail.sendEmail()', () => {
  let consumerWallet: Wallet;
  let providerWallet: Wallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;
  let validProtectedData: ProtectedDataWithSecretProps;
  let invalidProtectedData: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    providerWallet = getRandomWallet();
    consumerWallet = getRandomWallet();
    dataProtector = new IExecDataProtector(
      dataprotectorGetWeb3Provider(providerWallet.privateKey)
    );
    web3mail = new IExecWeb3mail(getWeb3Provider(consumerWallet.privateKey));

    //create valid protected data
    validProtectedData = await dataProtector.protectData({
      data: { email: 'example@test.com' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: validProtectedData.address,
      authorizedUser: consumerWallet.address, // consumer wallet
      numberOfAccess: 1000,
    });

    //create invalid protected data
    invalidProtectedData = await dataProtector.protectData({
      data: { foo: 'bar' },
      name: 'test do not use',
    });
    // avoid race condition with subgraph indexation
    await sleep(5_000);
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  afterAll(() => {
    dataProtector.revokeAllAccessObservable({
      protectedData: validProtectedData.address,
    });
  }, MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'should successfully send email',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should successfully send email with content type html',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent:
          '<html><body><h1>Test html</h1> <p>test paragraph </p></body></html>',
        protectedData: validProtectedData.address,
        contentType: 'text/html',
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail if the protected data is not valid',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: invalidProtectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'ProtectedData is not valid'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail if there is no Dataset order found',
    async () => {
      //create valid protected data with blank order to not have: datasetorder is fully consumed error from iexec sdk
      const protectedData = await dataProtector.protectData({
        data: { email: 'example@test.com' },
        name: 'test do not use',
      });
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
      };
      await sleep(5_000);
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'Dataset order not found'
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should successfully send email with a valid senderName',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should successfully send email with email content size < 512 kilo-bytes',
    async () => {
      const desiredSizeInBytes = 500000; // 500 kilo-bytes
      const characterToRepeat = 'A';
      const LARGE_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: LARGE_CONTENT,
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail to send email with email content size > 512 kilo-bytes',
    async () => {
      const desiredSizeInBytes = 520000; // 520 kilo-bytes
      const characterToRepeat = 'A';
      const OVERSIZED_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: OVERSIZED_CONTENT,
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'emailContent must be at most 512000 characters'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail to send email with an invalid (too short) senderName',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        senderName: 'AB',
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'senderName must be at least 3 characters'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail to send email with an invalid (too long) senderName',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        senderName: 'A very long sender name',
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'senderName must be at most 20 characters'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should successfully send email with a valid label',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        label: 'ID1234678',
      };
      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail to send email with an invalid (too long) label',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        label: 'ID123456789',
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'label must be at most 10 characters'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should fail to send email with an invalid (too short) label',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        label: 'ID',
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'label must be at least 3 characters'
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
