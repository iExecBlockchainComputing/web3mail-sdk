import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { IExecWeb3mail } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomDataset,
  getTestConfig,
  getTestWeb3SignerProvider,
  getTestIExecOption,
  waitSubgraphIndexing,
} from '../test-utils.js';
import IExec from 'iexec/IExec';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let protectedData: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    web3mail = new IExecWeb3mail(...getTestConfig(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { email: 'test@gmail.com' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'pass with a granted access for a specific requester',
    async () => {
      await dataProtector.grantAccess({
        authorizedApp: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
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
        authorizedApp: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
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
        authorizedApp: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
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
      await waitSubgraphIndexing();

      await dataProtector.grantAccess({
        authorizedApp: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
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

  describe('bulkOnly parameter', () => {
    let protectedDataWithBulk: any;
    let protectedDataWithoutBulk: any;
    const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

    beforeAll(async () => {
      protectedDataWithBulk = await dataProtector.protectData({
        data: { email: 'bulk@test.com' },
        name: 'test bulk access',
      });
      protectedDataWithoutBulk = await dataProtector.protectData({
        data: { email: 'nobulk@test.com' },
        name: 'test no bulk access',
      });
      await waitSubgraphIndexing();
    }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

    it(
      'should return only contacts with bulk access when bulkOnly is true',
      async () => {
        // Grant access with allowBulk: true
        await dataProtector.grantAccess({
          authorizedApp: defaultConfig.dappAddress,
          protectedData: protectedDataWithBulk.address,
          authorizedUser: wallet.address,
          allowBulk: true,
        });

        // Grant access with allowBulk: false (or default)
        await dataProtector.grantAccess({
          authorizedApp: defaultConfig.dappAddress,
          protectedData: protectedDataWithoutBulk.address,
          authorizedUser: wallet.address,
          allowBulk: false,
        });

        await waitSubgraphIndexing();

        // Fetch contacts with bulkOnly: true
        const contactsWithBulkOnly = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });

        // Should only include the contact with bulk access
        const bulkContact = contactsWithBulkOnly.find(
          (contact) =>
            contact.address === protectedDataWithBulk.address.toLowerCase()
        );
        const noBulkContact = contactsWithBulkOnly.find(
          (contact) =>
            contact.address === protectedDataWithoutBulk.address.toLowerCase()
        );

        expect(bulkContact).toBeDefined();
        expect(noBulkContact).toBeUndefined();
      },
      MAX_EXPECTED_BLOCKTIME +
        MAX_EXPECTED_SUBGRAPH_INDEXING_TIME +
        MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should return all contacts when bulkOnly is false',
      async () => {
        // Fetch contacts with bulkOnly: false (default)
        const contactsWithoutBulkOnly = await web3mail.fetchMyContacts({
          bulkOnly: false,
        });

        // Should include both contacts
        const bulkContact = contactsWithoutBulkOnly.find(
          (contact) =>
            contact.address === protectedDataWithBulk.address.toLowerCase()
        );
        const noBulkContact = contactsWithoutBulkOnly.find(
          (contact) =>
            contact.address === protectedDataWithoutBulk.address.toLowerCase()
        );

        expect(bulkContact).toBeDefined();
        expect(noBulkContact).toBeDefined();
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should return all contacts when bulkOnly is not specified (default)',
      async () => {
        // Fetch contacts without specifying bulkOnly (defaults to false)
        const contactsDefault = await web3mail.fetchMyContacts();

        // Should include both contacts
        const bulkContact = contactsDefault.find(
          (contact) =>
            contact.address === protectedDataWithBulk.address.toLowerCase()
        );
        const noBulkContact = contactsDefault.find(
          (contact) =>
            contact.address === protectedDataWithoutBulk.address.toLowerCase()
        );

        expect(bulkContact).toBeDefined();
        expect(noBulkContact).toBeDefined();
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
