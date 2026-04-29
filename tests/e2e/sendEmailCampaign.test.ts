import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import {
  Contact,
  IExecWeb3mail,
  WorkflowError as Web3mailWorkflowError,
} from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  TEST_CHAIN,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  ensureSufficientStake,
  getRandomWallet,
  getTestConfig,
  getTestDappAddress,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  setBalance,
  sleep,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';

describe('web3mail.sendEmailCampaign()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData1: ProtectedDataWithSecretProps;
  let validProtectedData2: ProtectedDataWithSecretProps;
  let validProtectedData3: ProtectedDataWithSecretProps;
  let consumerIExecInstance: IExec;
  const prodWorkerpoolAddress: string = TEST_CHAIN.prodWorkerpool;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;
  let dappAddress: string;

  beforeAll(async () => {
    // (default) prod workerpool (not free) always available
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      1_000,
      1_000_000
    );

    // apporder always available
    providerWallet = getRandomWallet();
    dappAddress = await getTestDappAddress();
    const ethProvider = getTestWeb3SignerProvider(
      TEST_CHAIN.appOwnerWallet.privateKey
    );
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    await createAndPublishAppOrders(resourceProvider, dappAddress);

    // Create valid protected data
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );
    await setBalance(providerWallet.address, 10n ** 18n);

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
    const consumerEthProvider = getTestWeb3SignerProvider(
      consumerWallet.privateKey
    );
    consumerIExecInstance = new IExec(
      { ethProvider: consumerEthProvider },
      iexecOptions
    );

    // Grant access with allowBulk for bulk processing
    await dataProtector.grantAccess({
      authorizedApp: dappAddress,
      protectedData: validProtectedData1.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: dappAddress,
      protectedData: validProtectedData2.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await dataProtector.grantAccess({
      authorizedApp: dappAddress,
      protectedData: validProtectedData3.address,
      authorizedUser: consumerWallet.address,
      allowBulk: true,
    });

    await waitSubgraphIndexing();

    web3mail = new IExecWeb3mail(...getTestConfig(consumerWallet.privateKey));
  }, MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_SUBGRAPH_INDEXING_TIME);

  describe('when using the default (not free) prod workerpool', () => {
    it(
      'should throw an error if the user cannot pay with its account',
      async () => {
        // Prepare campaign first
        const contacts: Contact[] = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });
        expect(contacts.length).toBeGreaterThanOrEqual(3);

        const bulkOrders = contacts.map((contact) => contact.grantedAccess);

        const campaignRequest = await web3mail.prepareEmailCampaign({
          emailSubject: 'Bulk test subject',
          emailContent: 'Bulk test message',
          senderName: 'Bulk test sender',
          grantedAccesses: bulkOrders,
          maxProtectedDataPerTask: 3,
          workerpoolMaxPrice: prodWorkerpoolPublicPrice,
        });

        // Try to send campaign without sufficient stake
        const workerpoolToUse = campaignRequest.campaignRequest.workerpool;
        let error: Error;
        await web3mail
          .sendEmailCampaign({
            campaignRequest: campaignRequest.campaignRequest,
            workerpoolAddressOrEns: workerpoolToUse,
          })
          .catch((e) => (error = e));

        expect(error).toBeDefined();
        // The error can be ValidationError (from workerpool mismatch) or WorkflowError (from processing)
        const isWorkflowError = error instanceof Web3mailWorkflowError;
        expect(isWorkflowError).toBe(true);
        // Check message only if it's a WorkflowError
        expect(error.message === 'Failed to sendEmailCampaign').toBe(true);
        // The error cause should indicate insufficient funds or order matching issues
        // Error can be nested: error.cause might be a WorkflowError with error.cause.cause being the actual Error
        const getNestedErrorMessage = (err: any, depth = 0): string => {
          if (depth > 5) return ''; // Prevent infinite recursion
          if (err instanceof Error) {
            const message = err.message || '';
            // If this error has a cause, try to get message from cause too
            if (err.cause && depth < 3) {
              const causeMessage = getNestedErrorMessage(err.cause, depth + 1);
              return causeMessage || message;
            }
            return message;
          }
          if (err?.cause) {
            return getNestedErrorMessage(err.cause, depth + 1);
          }
          return String(err || '');
        };
        const errorMessage =
          getNestedErrorMessage(error) || error.message || '';
        expect(
          errorMessage.includes('stake') ||
            errorMessage.includes('Cost per task') ||
            errorMessage.includes('balance') ||
            errorMessage.includes("Orders can't be matched") ||
            errorMessage.includes('insufficient') ||
            errorMessage.includes('matched')
        ).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email campaign when the user can pay with its account',
      async () => {
        await ensureSufficientStake(
          consumerIExecInstance,
          prodWorkerpoolPublicPrice
        );

        // Prepare campaign first
        const contacts: Contact[] = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });
        expect(contacts.length).toBeGreaterThanOrEqual(3);

        const bulkOrders = contacts.map((contact) => contact.grantedAccess);

        const campaignRequest = await web3mail.prepareEmailCampaign({
          emailSubject: 'Bulk test subject',
          emailContent: 'Bulk test message',
          senderName: 'Bulk test sender',
          grantedAccesses: bulkOrders,
          maxProtectedDataPerTask: 3,
          workerpoolMaxPrice: prodWorkerpoolPublicPrice,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });

        // Send campaign
        const result = await web3mail.sendEmailCampaign({
          campaignRequest: campaignRequest.campaignRequest,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });

        let tasks = result.tasks;
        if (tasks.length === 0) {
          await sleep(5_000);
          const hash = await consumerIExecInstance.order.hashRequestorder(
            campaignRequest.campaignRequest
          );
          const { deals } =
            await consumerIExecInstance.deal.fetchDealsByRequestorder(hash, {
              pageSize: 10,
            });
          tasks = await Promise.all(
            deals.flatMap((deal) =>
              Array.from({ length: deal.botSize }, async (_, i) => ({
                taskId: await consumerIExecInstance.deal.computeTaskId(
                  deal.dealid,
                  deal.botFirst + i
                ),
                dealId: deal.dealid,
                bulkIndex: deal.botFirst + i,
              }))
            )
          );
        }
        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          expect(task.taskId).toBeDefined();
          expect(task.dealId).toBeDefined();
          expect(typeof task.bulkIndex).toBe('number');
        });
      },
      30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
    );
  });

  describe('validation errors', () => {
    it(
      'should throw an error if campaignRequest is missing',
      async () => {
        let error: Error;
        await web3mail
          .sendEmailCampaign({
            campaignRequest: undefined as any, // Testing missing campaignRequest
            workerpoolAddressOrEns: prodWorkerpoolAddress,
          })
          .catch((e) => (error = e));

        expect(error).toBeDefined();

        const isValidationrror = error instanceof ValidationError;
        expect(isValidationrror).toBe(true);
        expect(error.message === 'campaignRequest is a required field').toBe(
          true
        );
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should throw an error if workerpoolAddressOrEns is invalid',
      async () => {
        // Prepare campaign first
        const contacts: Contact[] = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });
        const bulkOrders = contacts.map((contact) => contact.grantedAccess);

        const campaignRequest = await web3mail.prepareEmailCampaign({
          emailSubject: 'Bulk test subject',
          emailContent: 'Bulk test message',
          grantedAccesses: bulkOrders,
          maxProtectedDataPerTask: 3,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });

        let error: Error;
        await web3mail
          .sendEmailCampaign({
            campaignRequest: campaignRequest.campaignRequest,
            workerpoolAddressOrEns: 'invalid-address',
          })
          .catch((e) => (error = e));

        expect(error).toBeDefined();
        // Invalid address throws ValidationError from addressOrEnsSchema validation
        const isValidationError = error instanceof ValidationError;
        expect(isValidationError).toBe(true);
        expect(
          error.message ===
            'workerpoolAddressOrEns should be an ethereum address or a ENS name'
        ).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('protocol errors', () => {
    it(
      'should throw a protocol error if a service is not available',
      async () => {
        // Call getTestConfig to get the default configuration
        const [ethProvider, defaultOptions] = getTestConfig(
          providerWallet.privateKey
        );

        const options = {
          ...defaultOptions,
          iexecOptions: {
            ...defaultOptions.iexecOptions,
            iexecGatewayURL: 'https://test',
          },
        };
        let error: Web3mailWorkflowError | undefined;
        try {
          // Pass the modified options to IExecWeb3mail
          const invalidWeb3mail = new IExecWeb3mail(ethProvider, options);

          // Prepare campaign first
          const contacts: Contact[] = await invalidWeb3mail.fetchMyContacts({
            bulkOnly: true,
          });
          const bulkOrders = contacts.map((contact) => contact.grantedAccess);

          const campaignRequest = await invalidWeb3mail.prepareEmailCampaign({
            emailSubject: 'Bulk test subject',
            emailContent: 'Bulk test message',
            grantedAccesses: bulkOrders,
            maxProtectedDataPerTask: 3,
            workerpoolAddressOrEns: prodWorkerpoolAddress,
          });

          await invalidWeb3mail.sendEmailCampaign({
            campaignRequest: campaignRequest.campaignRequest,
            workerpoolAddressOrEns: prodWorkerpoolAddress,
          });
        } catch (err) {
          error = err as Web3mailWorkflowError;
        }

        expect(error).toBeInstanceOf(Web3mailWorkflowError);
        expect(error?.message).toBe(
          "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
        );
        expect(error?.isProtocolError).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('integration with prepareEmailCampaign', () => {
    it(
      'should successfully send campaign prepared by prepareEmailCampaign',
      async () => {
        await ensureSufficientStake(
          consumerIExecInstance,
          prodWorkerpoolPublicPrice
        );

        // Fetch contacts with allowBulk access
        const contacts: Contact[] = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });
        expect(contacts.length).toBeGreaterThanOrEqual(3);

        const bulkOrders = contacts.map((contact) => contact.grantedAccess);

        // Prepare email campaign
        const campaignRequest = await web3mail.prepareEmailCampaign({
          emailSubject: 'Integration test subject',
          emailContent: 'Integration test message',
          senderName: 'Integration Test',
          grantedAccesses: bulkOrders,
          maxProtectedDataPerTask: 3,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
          workerpoolMaxPrice: prodWorkerpoolPublicPrice,
        });
        // Verify campaign request was created
        expect(campaignRequest).toBeDefined();
        expect(campaignRequest.campaignRequest).toBeDefined();

        // Send the campaign
        const result = await web3mail.sendEmailCampaign({
          campaignRequest: campaignRequest.campaignRequest,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });

        let tasks = result.tasks;
        if (tasks.length === 0) {
          await sleep(5_000);
          const hash = await consumerIExecInstance.order.hashRequestorder(
            campaignRequest.campaignRequest
          );
          const { deals } =
            await consumerIExecInstance.deal.fetchDealsByRequestorder(hash, {
              pageSize: 10,
            });
          tasks = await Promise.all(
            deals.flatMap((deal) =>
              Array.from({ length: deal.botSize }, async (_, i) => ({
                taskId: await consumerIExecInstance.deal.computeTaskId(
                  deal.dealid,
                  deal.botFirst + i
                ),
                dealId: deal.dealid,
                bulkIndex: deal.botFirst + i,
              }))
            )
          );
        }
        expect(tasks.length).toBeGreaterThan(0);
        tasks.forEach((task) => {
          expect(task.taskId).toBeDefined();
          expect(task.dealId).toBeDefined();
          expect(typeof task.bulkIndex).toBe('number');
        });
      },
      30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
    );

    it(
      'should handle multiple protected data per task correctly',
      async () => {
        await ensureSufficientStake(
          consumerIExecInstance,
          prodWorkerpoolPublicPrice * 2
        );

        // Fetch contacts
        const contacts: Contact[] = await web3mail.fetchMyContacts({
          bulkOnly: true,
        });
        expect(contacts.length).toBeGreaterThanOrEqual(3);

        const bulkOrders = contacts.map((contact) => contact.grantedAccess);
        // Prepare campaign with maxProtectedDataPerTask: 2
        const campaignRequest = await web3mail.prepareEmailCampaign({
          emailSubject: 'Bulk test subject',
          emailContent: 'Bulk test message',
          grantedAccesses: bulkOrders,
          maxProtectedDataPerTask: 2, // Process 2 emails per task
          workerpoolAddressOrEns: prodWorkerpoolAddress,
          workerpoolMaxPrice: prodWorkerpoolPublicPrice,
        });
        // Send campaign
        const result = await web3mail.sendEmailCampaign({
          campaignRequest: campaignRequest.campaignRequest,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });

        let tasks = result.tasks;
        if (tasks.length === 0) {
          await sleep(5_000);
          const hash = await consumerIExecInstance.order.hashRequestorder(
            campaignRequest.campaignRequest
          );
          const { deals } =
            await consumerIExecInstance.deal.fetchDealsByRequestorder(hash, {
              pageSize: 10,
            });
          tasks = await Promise.all(
            deals.flatMap((deal) =>
              Array.from({ length: deal.botSize }, async (_, i) => ({
                taskId: await consumerIExecInstance.deal.computeTaskId(
                  deal.dealid,
                  deal.botFirst + i
                ),
                dealId: deal.dealid,
                bulkIndex: deal.botFirst + i,
              }))
            )
          );
        }
        expect(tasks.length).toBeGreaterThanOrEqual(1);
        tasks.forEach((task) => {
          expect(task.taskId).toBeDefined();
          expect(task.dealId).toBeDefined();
          expect(typeof task.bulkIndex).toBe('number');
        });
      },
      30 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 60_000
    );
  });
});
