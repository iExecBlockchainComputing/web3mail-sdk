import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import { IExecWeb3mail, WorkflowError } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
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
  setEthForGas,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';

describe('web3mail.sendEmail()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData: ProtectedDataWithSecretProps;
  let invalidProtectedData: ProtectedDataWithSecretProps;
  let consumerIExecInstance: IExec;
  let prodWorkerpoolAddress: string;
  let paidOnlyWorkerpoolAddress: string;
  let dappAddress: string;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;

  beforeAll(async () => {
    // paid workerpool order for the "not free" tests
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

    prodWorkerpoolAddress = TEST_CHAIN.prodWorkerpool;
    paidOnlyWorkerpoolAddress = TEST_CHAIN.paidOnlyWorkerpool;

    // paid-only workerpool: never publish free orders here so negative tests
    // that expect "no workerpool order" or "insufficient stake" stay reliable
    // across repeated test:e2e runs (market orders persist in MongoDB).
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.paidOnlyWorkerpool,
      TEST_CHAIN.paidOnlyWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      1_000,
      1_000_000
    );

    //create valid protected data
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );
    await setBalance(providerWallet.address, 10n ** 18n);
    validProtectedData = await dataProtector.protectData({
      data: { email: 'example@test.com' },
      name: 'test do not use',
    });
    //create invalid protected data
    invalidProtectedData = await dataProtector.protectData({
      data: { foo: 'bar' },
      name: 'test do not use',
    });
    await waitSubgraphIndexing();
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000);

  beforeEach(async () => {
    // use a fresh wallet for calling sendEmail
    consumerWallet = getRandomWallet();
    // matchOrders pays gas in ETH; free workerpool (0 nRLC stake) never hits ensureSufficientStake deposit path
    await setEthForGas(consumerWallet.address);
    const consumerEthProvider = getTestWeb3SignerProvider(
      consumerWallet.privateKey
    );
    consumerIExecInstance = new IExec(
      { ethProvider: consumerEthProvider },
      iexecOptions
    );
    await dataProtector.grantAccess({
      authorizedApp: dappAddress,
      protectedData: validProtectedData.address,
      authorizedUser: consumerWallet.address, // consumer wallet
      numberOfAccess: 1000,
    });
    web3mail = new IExecWeb3mail(...getTestConfig(consumerWallet.privateKey));
  });

  describe('when using the default (not free) prod workerpool', () => {
    describe('when using the user does not set the workerpoolMaxPrice', () => {
      it(
        'should throw an error No Workerpool order found for the desired price',
        async () => {
          let error: Error;
          await web3mail
            .sendEmail({
              emailSubject: 'e2e mail object for test',
              emailContent: 'e2e mail content for test',
              protectedData: validProtectedData.address,
              workerpoolAddressOrEns: paidOnlyWorkerpoolAddress,
            })
            .catch((e) => (error = e));
          expect(error).toBeDefined();
          expect(error.message).toBe('Failed to sendEmail');
          expect(error.cause).toStrictEqual(
            Error(`No Workerpool order found for the desired price`)
          );
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });
    describe('when using the user set the workerpoolMaxPrice', () => {
      it(
        `should throw an error if the user can't pay with its account`,
        async () => {
          let error: Error;
          await web3mail
            .sendEmail({
              emailSubject: 'e2e mail object for test',
              emailContent: 'e2e mail content for test',
              protectedData: validProtectedData.address,
              workerpoolAddressOrEns: paidOnlyWorkerpoolAddress,
              workerpoolMaxPrice: prodWorkerpoolPublicPrice,
            })
            .catch((e) => (error = e));
          expect(error).toBeInstanceOf(WorkflowError);
          expect(error.message).toBe('Failed to sendEmail');
          expect(error.cause).toStrictEqual(
            Error(
              `Cost per task (${prodWorkerpoolPublicPrice}) is greater than requester account stake (0). Orders can't be matched. If you are the requester, you should deposit to top up your account`
            )
          );
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
      it(
        'should successfully send an email when the user can pay with its account',
        async () => {
          await ensureSufficientStake(
            consumerIExecInstance,
            prodWorkerpoolPublicPrice
          );
          const sendEmailResponse = await web3mail.sendEmail({
            emailSubject: 'e2e mail object for test',
            emailContent: 'e2e mail content for test',
            protectedData: validProtectedData.address,
            workerpoolMaxPrice: prodWorkerpoolPublicPrice,
          });
          expect(sendEmailResponse).toStrictEqual({
            taskId: expect.any(String),
            dealId: expect.any(String),
          });
        },
        2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });
  });

  it(
    'should fail if the protected data is not valid',
    async () => {
      await expect(
        web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: invalidProtectedData.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        })
      ).rejects.toThrow(
        new Error(
          'This protected data does not contain "email:string" in its schema.'
        )
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
      await waitSubgraphIndexing();

      await expect(
        web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: protectedData.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
          workerpoolMaxPrice: prodWorkerpoolPublicPrice,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to sendEmail',
          errorCause: Error('No Dataset order found for the desired price'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000
  );

  it(
    'should throw a protocol error id a service is not available',
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

      // Pass the modified options to IExecWeb3mail
      const invalidWeb3mail = new IExecWeb3mail(ethProvider, options);
      let error: WorkflowError | undefined;

      try {
        await invalidWeb3mail.sendEmail({
          protectedData: validProtectedData.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
          emailSubject: 'My email subject',
          emailContent: 'My email content',
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

  describe('when using the free prod workerpool', () => {
    beforeAll(async () => {
      await createAndPublishWorkerpoolOrder(
        TEST_CHAIN.prodWorkerpool,
        TEST_CHAIN.prodWorkerpoolOwnerWallet,
        NULL_ADDRESS,
        0,
        1_000
      );
    }, MAX_EXPECTED_BLOCKTIME);

    it(
      'should successfully send email when using a free prod workerpool',
      async () => {
        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email with granted access to whitelist address',
      async () => {
        //create valid protected data
        const protectedDataForWhitelist = await dataProtector.protectData({
          data: { email: 'example@test.com' },
          name: 'test do not use',
        });
        await waitSubgraphIndexing();

        //grant access to whitelist
        await dataProtector.grantAccess({
          authorizedApp:
            getChainDefaultConfig(DEFAULT_CHAIN_ID)?.whitelistSmartContract, //whitelist address
          protectedData: protectedDataForWhitelist.address,
          authorizedUser: consumerWallet.address, // consumer wallet
          numberOfAccess: 1000,
        });

        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: protectedDataForWhitelist.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email with content type html',
      async () => {
        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent:
            '<html><body><h1>Test html</h1> <p>test paragraph </p></body></html>',
          protectedData: validProtectedData.address,
          contentType: 'text/html',
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email with a valid senderName',
      async () => {
        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          senderName: 'Product Team',
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email with email content size < 512 kilo-bytes',
      async () => {
        const desiredSizeInBytes = 500000; // 500 kilo-bytes
        const characterToRepeat = 'A';
        const LARGE_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: LARGE_CONTENT,
          protectedData: validProtectedData.address,
          senderName: 'Product Team',
          workerpoolAddressOrEns: prodWorkerpoolAddress,
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should successfully send email with a valid label',
      async () => {
        const sendEmailResponse = await web3mail.sendEmail({
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddressOrEns: prodWorkerpoolAddress,
          label: 'ID1234678',
        });
        expect(sendEmailResponse).toStrictEqual({
          taskId: expect.any(String),
          dealId: expect.any(String),
        });
        // TODO check label in created deal
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
