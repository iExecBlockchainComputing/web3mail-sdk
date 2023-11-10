import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
  getWeb3Provider as dataprotectorGetWeb3Provider,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { EnhancedWallet } from 'iexec';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../src/config/config.js';
import { IExecWeb3mail, getWeb3Provider } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../test-utils.js';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;
  let protectedData1: ProtectedDataWithSecretProps;
  let protectedData2: ProtectedDataWithSecretProps;
  let ethProvider: EnhancedWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    ethProvider = getWeb3Provider(wallet.privateKey);
    dataProtector = new IExecDataProtector(
      dataprotectorGetWeb3Provider(wallet.privateKey)
    );
    web3mail = new IExecWeb3mail(ethProvider);

    //create valid protected data
    protectedData1 = await dataProtector.protectData({
      data: { email: 'test1@gmail.com' },
      name: 'test do not use',
    });
    protectedData2 = await dataProtector.protectData({
      data: { email: 'test2@gmail.com' },
      name: 'test do not use',
    });
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'Tow different user should have different contacts',
    async () => {
      const user1 = Wallet.createRandom().address;
      const user2 = Wallet.createRandom().address;
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData1.address,
        authorizedUser: user1,
      });

      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
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
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
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
  it(
    'If granted access to both ens and whitelist should return only one contact',
    async () => {
      const whitelistAddress = '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2';

      const user1 = Wallet.createRandom().address;
      //Grant access to ens
      await dataProtector.grantAccess({
        authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
        protectedData: protectedData1.address,
        authorizedUser: user1,
      });
      //Grant access to whitelist
      await dataProtector.grantAccess({
        authorizedApp: whitelistAddress,
        protectedData: protectedData1.address,
        authorizedUser: user1,
      });

      const contactsUser1 = await web3mail.fetchUserContacts({
        userAddress: user1,
      });
      expect(contactsUser1.length).toEqual(1);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
