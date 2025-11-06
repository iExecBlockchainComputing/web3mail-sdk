import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { Contact, IExecWeb3mail } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  TEST_CHAIN,
  createAndPublishAppOrders,
  getRandomWallet,
  getTestConfig,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';

describe('web3mail.prepareEmailCampaign()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData1: ProtectedDataWithSecretProps;
  let validProtectedData2: ProtectedDataWithSecretProps;
  let validProtectedData3: ProtectedDataWithSecretProps;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  beforeAll(async () => {
    // Create app orders
    providerWallet = getRandomWallet();
    const ethProvider = getTestWeb3SignerProvider(
      TEST_CHAIN.appOwnerWallet.privateKey
    );
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    await createAndPublishAppOrders(
      resourceProvider,
      defaultConfig!.dappAddress
    );

    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );

    // create valid protected data
    validProtectedData1 = await dataProtector.protectData({
      data: { email: 'user1@example.com' },
      name: 'bulk test 1',
    });

    validProtectedData2 = await dataProtector.protectData({
      data: { email: 'user2@example.com' },
      name: 'bulk test 2',
    });

    validProtectedData3 = await dataProtector.protectData({
      data: { email: 'user3@example.com' },
      name: 'bulk test 3',
    });

    await waitSubgraphIndexing();
  }, 5 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  beforeEach(async () => {
    consumerWallet = getRandomWallet();

    // Grant access with allowBulk for bulk processing
    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
      protectedData: validProtectedData1.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
      protectedData: validProtectedData2.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: defaultConfig.dappAddress,
      protectedData: validProtectedData3.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await waitSubgraphIndexing();

    web3mail = new IExecWeb3mail(...getTestConfig(consumerWallet.privateKey));
  }, 3 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME + 10_000);

  it(
    'should prepare an email campaignRequest',
    async () => {
      // Fetch contacts with allowBulk access
      const contacts: Contact[] = await web3mail.fetchMyContacts({
        bulkOnly: true,
      });
      expect(contacts.length).toBeGreaterThanOrEqual(3);

      const bulkOrders = contacts.map((contact) => contact.grantedAccess);

      // Process the bulk request
      const result = await web3mail.prepareEmailCampaign({
        emailSubject: 'Bulk test subject',
        emailContent: 'Bulk test message',
        senderName: 'Bulk test sender',
        grantedAccess: bulkOrders,
        maxProtectedDataPerTask: 3,
        workerpoolMaxPrice: prodWorkerpoolPublicPrice,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.campaignRequest).toEqual({
        app: expect.any(String),
        appmaxprice: expect.any(String),
        workerpool: expect.any(String),
        workerpoolmaxprice: expect.any(String),
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        callback: '0x0000000000000000000000000000000000000000',
        params: expect.any(String),
        beneficiary: consumerWallet.address,
        category: '0',
        requester: consumerWallet.address,
        salt: expect.any(String),
        sign: expect.any(String),
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: '0',
        volume: '1',
      });
    },
    30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
  );
});
