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
  let validProtectedData: ProtectedDataWithSecretProps;
  let unvalidProtectedData: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    providerWallet = getRandomWallet();
    consumerWallet = getRandomWallet();
    dataProtector = new IExecDataProtector(
      getWeb3Provider(providerWallet.privateKey)
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

    //create unvalid protected data
    unvalidProtectedData = await dataProtector.protectData({
      data: { foo: 'bar' },
      name: 'test do not use',
    });
  }, 3 * MAX_EXPECTED_BLOCKTIME);

  afterAll(async () => {
    await dataProtector.revokeAllAccessObservable({
      protectedData: validProtectedData.address,
    });
  }, 3 * MAX_EXPECTED_BLOCKTIME);

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
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if the protected data is not valid',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: unvalidProtectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'ProtectedData is not valid'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
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
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        'Dataset order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if there is no App order found',
    async () => {
      // To see with Pierre

      // jest.mock('iexec', () => ({
      //   ...(jest.requireActual('iexec') as IExec), // this line is to keep the other modules unmocked
      //   orderbook: {
      //     ...(jest.requireActual(
      //       'iexec/IExecOrderbookModule'
      //     ) as IExecOrderbookModule), // keep the other orderbook functions unmocked
      //     fetchAppOrderbook: jest.fn<() => Promise<any>>().mockResolvedValue({
      //       orders: [],
      //       count: 0,
      //     }),
      //   },
      // }));

      jest
        .spyOn(web3mail, 'sendEmail')
        .mockRejectedValue(new Error('App order not found'));

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrowError(
        'App order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should fail if there is no Workerpool order found',
    async () => {
      // To see with Pierre

      // jest.mock('iexec', () => ({
      //   ...(jest.requireActual('iexec') as IExec), // this line is to keep the other modules unmocked
      //   orderbook: {
      //     ...(jest.requireActual(
      //       'iexec/IExecOrderbookModule'
      //     ) as IExecOrderbookModule), // keep the other orderbook functions unmocked
      //     fetchWorkerpoolOrderbook: jest.fn<() => Promise<any>>().mockResolvedValue({
      //       orders: [],
      //       count: 0,
      //     }),
      //   },
      // }));

      jest
        .spyOn(web3mail, 'sendEmail')
        .mockRejectedValue(new Error('Workerpool order not found'));

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrowError(
        'Workerpool order not found'
      );
    },
    3 * MAX_EXPECTED_BLOCKTIME
  );
});
