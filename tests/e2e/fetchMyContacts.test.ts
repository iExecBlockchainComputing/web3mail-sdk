import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../src/config/config.js';
import { IExecWeb3mail } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomDataset,
  getTestConfig,
  getTestWeb3SignerProvider,
  getTestIExecOption,
} from '../test-utils.js';
import IExec from 'iexec/IExec';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;
  let protectedData: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    web3mail = new IExecWeb3mail(...getTestConfig(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { email: 'test@gmail.com' },
      name: 'test do not use',
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'pass with a granted access for a specific requester',
    async () => {
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: wallet.address,
      });
      const res = await web3mail.fetchMyContacts();
      const foundContactForASpecificRequester = res.find((obj) => {
        return obj.address === protectedData.address.toLocaleLowerCase();
      });
      expect(
        foundContactForASpecificRequester &&
          foundContactForASpecificRequester.address
      ).toBeDefined();
      expect(
        foundContactForASpecificRequester &&
          foundContactForASpecificRequester.address
      ).toBe(protectedData.address.toLocaleLowerCase());
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'pass with a granted access for any requester',
    async () => {
      const grantedAccessForAnyRequester = await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData.address,
        authorizedUser: NULL_ADDRESS,
      });

      const res = await web3mail.fetchMyContacts();

      const foundContactForAnyRequester = res.find(
        (obj) => obj.address === protectedData.address.toLowerCase()
      );
      expect(
        foundContactForAnyRequester && foundContactForAnyRequester.address
      ).toBeDefined();
      expect(
        foundContactForAnyRequester && foundContactForAnyRequester.address
      ).toBe(protectedData.address.toLocaleLowerCase());

      //revoke access to not appear as contact for anyone
      const revoke = await dataProtector.revokeOneAccess(
        grantedAccessForAnyRequester
      );
      expect(revoke).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'Should not return dataset as a contact',
    async () => {
      const iexecOptions = getTestIExecOption();

      const iexec = new IExec(
        { ethProvider: getTestWeb3SignerProvider(wallet.privateKey) },
        iexecOptions
      );
      const dataset = await deployRandomDataset(iexec);
      const encryptionKey = await iexec.dataset.generateEncryptionKey();
      await iexec.dataset.pushDatasetSecret(dataset.address, encryptionKey);
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: dataset.address,
        authorizedUser: wallet.address,
      });
      const myContacts = await web3mail.fetchMyContacts();
      expect(myContacts.map(({ address }) => address)).not.toContain(
        dataset.address
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should return only contacts that have a valid email',
    async () => {
      const notValidProtectedData = await dataProtector.protectData({
        data: { notemail: 'not email' },
        name: 'test do not use',
      });

      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: notValidProtectedData.address,
        authorizedUser: wallet.address,
      });

      const res = await web3mail.fetchMyContacts();

      expect(
        res.filter(
          (contact) => contact.address === notValidProtectedData.address
        )
      ).toStrictEqual([]);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it.only(
    'should throw a workflow error',
    async () => {
      // Call getTestConfig to get the default configuration
      const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);

      // Override the iexecGatewayURL in the options
      const options = {
        ...defaultOptions,
        iexecOptions: {
          ...defaultOptions.iexecOptions,
          iexecGatewayURL: 'https://test',
        },
      };

      // Pass the modified options to IExecWeb3mail
      const invalidWeb3mail = new IExecWeb3mail(ethProvider, options);
      // Use expect with toThrowError to verify the error
      await expect(invalidWeb3mail.fetchMyContacts()).rejects.toThrow(
        new Error(
          "Failed to fetch my contacts: A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
        )
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
