import {
  IExecDataProtectorCore,
  ProcessBulkRequestResponse,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import {
  Contact,
  IExecWeb3mail,
  SendEmailSingleResponse,
} from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  TEST_CHAIN,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  ensureSufficientStake,
  getRandomWallet,
  getTestConfig,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';

describe('web3mail.sendEmail() - Bulk Processing', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData1: ProtectedDataWithSecretProps;
  let validProtectedData2: ProtectedDataWithSecretProps;
  let validProtectedData3: ProtectedDataWithSecretProps;
  let consumerIExecInstance: IExec;
  let consumerDataProtectorInstance: IExecDataProtectorCore;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  beforeAll(async () => {
    // Create workerpool orders
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      1_000,
      prodWorkerpoolPublicPrice
    );

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
      data: { email: 'test1@example.com' },
      name: 'bulk test 1',
    });

    validProtectedData2 = await dataProtector.protectData({
      data: { email: 'test2@example.com' },
      name: 'bulk test 2',
    });

    validProtectedData3 = await dataProtector.protectData({
      data: { email: 'test3@example.com' },
      name: 'bulk test 3',
    });

    await waitSubgraphIndexing();
  }, 5 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  beforeEach(async () => {
    consumerWallet = getRandomWallet();
    const consumerEthProvider = getTestWeb3SignerProvider(
      consumerWallet.privateKey
    );
    consumerIExecInstance = new IExec(
      { ethProvider: consumerEthProvider },
      iexecOptions
    );

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
    consumerDataProtectorInstance = new IExecDataProtectorCore(
      ...getTestConfig(consumerWallet.privateKey)
    );
  }, MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME);

  describe('Bulk email sending', () => {
    it(
      'should successfully process bulk request',
      async () => {
        // Fetch contacts with allowBulk access
        const contacts: Contact[] = await web3mail.fetchMyContacts();
        expect(contacts.length).toBeGreaterThanOrEqual(3);

        // Ensure consumer has sufficient stake
        await ensureSufficientStake(
          consumerIExecInstance,
          prodWorkerpoolPublicPrice
        );

        const bulkOrders = contacts.map((contact) => contact.grantedAccess);

        // Prepare email content encryption and upload (like sendEmail does for single)
        const emailSubject = 'Bulk test subject';
        const emailContent = 'Bulk test message';
        const iexec = consumerIExecInstance;
        const emailContentEncryptionKey = iexec.dataset.generateEncryptionKey();
        const encryptedFile = await iexec.dataset.encrypt(
          Buffer.from(emailContent, 'utf8'),
          emailContentEncryptionKey
        );

        // Upload to IPFS using local test configuration
        const { add } = await import('../../src/utils/ipfs-service.js');
        const cid = await add(encryptedFile, {
          ipfsNode: TEST_CHAIN.ipfsNode,
          ipfsGateway: TEST_CHAIN.ipfsGateway,
        });
        const multiaddr = `/ipfs/${cid}`;

        // Prepare secrets like sendEmail does
        const secrets = {
          1: JSON.stringify({
            senderName: 'Bulk Test Sender',
            emailSubject: emailSubject,
            emailContentMultiAddr: multiaddr,
            contentType: 'text/plain',
            emailContentEncryptionKey,
            useCallback: true,
          }),
        };

        // Prepare the bulk request using the contacts
        await consumerDataProtectorInstance.prepareBulkRequest({
          bulkOrders,
          app: defaultConfig.dappAddress,
          workerpool: TEST_CHAIN.prodWorkerpool,
          secrets,
          maxProtectedDataPerTask: 3,
          appMaxPrice: 1000,
          workerpoolMaxPrice: 1000,
        });

        // Process the bulk request
        const result: ProcessBulkRequestResponse | SendEmailSingleResponse =
          await web3mail.sendEmail({
            emailSubject: 'Bulk test subject',
            emailContent: 'Bulk test message',
            // protectedData is optional when grantedAccess is provided
            grantedAccess: bulkOrders,
            maxProtectedDataPerTask: 3,
            workerpoolMaxPrice: prodWorkerpoolPublicPrice,
          });

        // Verify the result
        expect(result).toBeDefined();
        expect('tasks' in result).toBe(true);
        const tasks = 'tasks' in result ? result.tasks : [];
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          expect(task.taskId).toBeDefined();
          expect(task.dealId).toBeDefined();
          expect(task.bulkIndex).toBeDefined();
        });
      },
      30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
    );
  });
});
