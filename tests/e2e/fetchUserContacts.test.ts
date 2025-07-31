import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { IExecWeb3mail, WorkflowError } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
  waitSubgraphIndexing,
} from '../test-utils.js';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let protectedData1: ProtectedDataWithSecretProps;
  let protectedData2: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    web3mail = new IExecWeb3mail(...getTestConfig(wallet.privateKey));

    //create valid protected data
    protectedData1 = await dataProtector.protectData({
      data: { email: 'test1@gmail.com' },
      name: 'test do not use',
    });
    protectedData2 = await dataProtector.protectData({
      data: { email: 'test2@gmail.com' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  describe('when no access is granted', () => {
    it('contacts should contain name, accessPrice, remainingAccess, owner, accessGrantTimestamp, and isUserStrict', async () => {
      const userWithAccess = Wallet.createRandom().address;

      await web3mail.init();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const authorizedApp = web3mail['dappAddressOrENS'];

      await dataProtector.grantAccess({
        authorizedApp: authorizedApp,
        protectedData: protectedData1.address,
        authorizedUser: userWithAccess,
      });

      const contacts = await web3mail.fetchUserContacts({
        userAddress: userWithAccess,
        isUserStrict: true,
      });
      expect(contacts.length).toBe(1);
      expect(contacts[0].address).toBe(protectedData1.address.toLowerCase());
      expect(contacts[0].owner).toBeDefined();
      expect(contacts[0].accessPrice).toBe(0);
      expect(contacts[0].remainingAccess).toBe(1);
      expect(contacts[0].accessGrantTimestamp).toBeDefined();
      expect(contacts[0].isUserStrict).toBe(true);
      expect(contacts[0].name).toBe('test do not use');
    });

    it(
      'should return an empty contact array',
      async () => {
        const userNoAccess = Wallet.createRandom().address;

        const contacts = await web3mail.fetchUserContacts({
          userAddress: userNoAccess,
          isUserStrict: true,
        });
        expect(contacts.length).toBe(0);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('when access is granted', () => {
    it(
      'should return the user contacts for both app and whitelist',
      async () => {
        const userWithAccess = Wallet.createRandom().address;
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;
        const authorizedWhitelist = defaultConfig!.whitelistSmartContract;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: userWithAccess,
        });

        await dataProtector.grantAccess({
          authorizedApp: authorizedWhitelist,
          protectedData: protectedData2.address,
          authorizedUser: userWithAccess,
        });

        const contacts = await web3mail.fetchUserContacts({
          userAddress: userWithAccess,
          isUserStrict: true,
        });
        expect(contacts.length).toBe(2);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'Two different user should have different contacts',
      async () => {
        const user1 = Wallet.createRandom().address;
        const user2 = Wallet.createRandom().address;
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: user1,
        });

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData2.address,
          authorizedUser: user2,
        });

        const contactUser1 = await web3mail.fetchUserContacts({
          userAddress: user1,
        });
        const contactUser2 = await web3mail.fetchUserContacts({
          userAddress: user2,
        });
        expect(contactUser1).not.toEqual(contactUser2);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'Test that the protected data can be accessed by authorized user',
      async () => {
        const userWithAccess = Wallet.createRandom().address;
        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: userWithAccess,
        });
        const contacts = await web3mail.fetchUserContacts({
          userAddress: userWithAccess,
        });
        expect(contacts.length).toBeGreaterThan(0);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('when iexec market API is not reachable', () => {
    it(
      'should throw a protocol error',
      async () => {
        // Call getTestConfig to get the default configuration
        const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);
        const user1 = Wallet.createRandom().address;

        const options = {
          ...defaultOptions,
          iexecOptions: {
            ...defaultOptions.iexecOptions,
            iexecGatewayURL: 'https://test',
          },
        };

        // Pass the modified options to IExecWeb3mail
        const invalidWeb3mail = new IExecWeb3mail(ethProvider, options);
        let error: WorkflowError | undefined;

        try {
          await invalidWeb3mail.fetchUserContacts({
            userAddress: user1,
          });
        } catch (err) {
          error = err as WorkflowError;
        }

        expect(error).toBeInstanceOf(WorkflowError);
        expect(error?.message).toBe(
          "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
        );
        expect(error?.isProtocolError).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('when subgraph is not reachable', () => {
    it(
      'should throw a fetchUserContacts error',
      async () => {
        // Call getTestConfig to get the default configuration
        const [ethProvider, defaultOptions] = getTestConfig(wallet.privateKey);

        const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
        expect(defaultConfig).not.toBeNull();
        const authorizedApp = defaultConfig!.dappAddress;

        await dataProtector.grantAccess({
          authorizedApp: authorizedApp,
          protectedData: protectedData1.address,
          authorizedUser: ethProvider.address,
        });

        const options = {
          ...defaultOptions,
          dataProtectorSubgraph: 'https://test',
        };

        // Pass the modified options to IExecWeb3mail
        const invalidWeb3mail = new IExecWeb3mail(ethProvider, options);
        let error: WorkflowError | undefined;

        try {
          await invalidWeb3mail.fetchMyContacts();
        } catch (err) {
          error = err as WorkflowError;
        }

        expect(error).toBeInstanceOf(WorkflowError);
        expect(error?.message).toBe('Failed to fetch user contacts');
        expect(error?.isProtocolError).toBe(false);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
