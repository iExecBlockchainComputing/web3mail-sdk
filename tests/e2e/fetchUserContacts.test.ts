import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../src/config/config.js';
import { IExecWeb3mail } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
} from '../test-utils.js';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;
  let protectedData1: ProtectedDataWithSecretProps;
  let protectedData2: ProtectedDataWithSecretProps;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
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
});
