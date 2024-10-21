import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet } from 'ethers';
import {
  WEB3_MAIL_DAPP_ADDRESS,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../../src/config/config.js';
import { IExecWeb3mail, WorkflowError } from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  TEST_CHAIN,
  addVoucherEligibleAsset,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  createVoucher,
  createVoucherType,
  ensureSufficientStake,
  getRandomWallet,
  getTestConfig,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  waitSubgraphIndexing,
} from '../test-utils.js';
import { IExec } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';

describe('web3mail.sendEmail()', () => {
  let consumerWallet: HDNodeWallet;
  let providerWallet: HDNodeWallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtectorCore;
  let validProtectedData: ProtectedDataWithSecretProps;
  let invalidProtectedData: ProtectedDataWithSecretProps;
  let consumerIExecInstance: IExec;
  let prodWorkerpoolAddress: string;
  let debugWorkerpoolAddress: string;
  const workerpoolprice = 1000;
  const iexecOptions = getTestIExecOption();

  beforeAll(async () => {
    providerWallet = getRandomWallet();
    const ethProvider = getTestWeb3SignerProvider(
      TEST_CHAIN.appOwnerWallet.privateKey
    );
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    debugWorkerpoolAddress = await resourceProvider.ens.resolveName(
      TEST_CHAIN.debugWorkerpool
    );
    prodWorkerpoolAddress = await resourceProvider.ens.resolveName(
      TEST_CHAIN.prodWorkerpool
    );
    await createAndPublishAppOrders(resourceProvider, WEB3_MAIL_DAPP_ADDRESS);
    // free workerpool
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.debugWorkerpool,
      TEST_CHAIN.debugWorkerpoolOwnerWallet
    );
    //create valid protected data
    dataProtector = new IExecDataProtectorCore(
      ...getTestConfig(providerWallet.privateKey)
    );
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
    consumerWallet = getRandomWallet();
    const consumerEthProvider = getTestWeb3SignerProvider(
      consumerWallet.privateKey
    );
    consumerIExecInstance = new IExec(
      { ethProvider: consumerEthProvider },
      iexecOptions
    );
    await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: validProtectedData.address,
      authorizedUser: consumerWallet.address, // consumer wallet
      numberOfAccess: 1000,
    });
    web3mail = new IExecWeb3mail(...getTestConfig(consumerWallet.privateKey));
  });

  it(
    'should successfully send email',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
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
        authorizedApp: WHITELIST_SMART_CONTRACT_ADDRESS, //whitelist address
        protectedData: protectedDataForWhitelist.address,
        authorizedUser: consumerWallet.address, // consumer wallet
        numberOfAccess: 1000,
      });

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedDataForWhitelist.address,
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send email with content type html',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent:
          '<html><body><h1>Test html</h1> <p>test paragraph </p></body></html>',
        protectedData: validProtectedData.address,
        contentType: 'text/html',
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should fail if the protected data is not valid',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: invalidProtectedData.address,
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      await expect(web3mail.sendEmail(params)).rejects.toThrow(
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

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedData.address,
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };
      await expect(web3mail.sendEmail(params)).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to sendEmail',
          errorCause: Error('No Dataset order found for the desired price'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME + 5_000
  );

  it(
    'should successfully send email with a valid senderName',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send email with email content size < 512 kilo-bytes',
    async () => {
      const desiredSizeInBytes = 500000; // 500 kilo-bytes
      const characterToRepeat = 'A';
      const LARGE_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);

      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: LARGE_CONTENT,
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
        workerpoolAddressOrEns: debugWorkerpoolAddress,
      };

      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully send email with a valid label',
    async () => {
      const params = {
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        workerpoolAddressOrEns: debugWorkerpoolAddress,
        label: 'ID1234678',
      };
      const sendEmailResponse = await web3mail.sendEmail(params);
      expect(sendEmailResponse.taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw a protocol error',
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
          workerpoolAddressOrEns: debugWorkerpoolAddress,
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
  it(
    'should throw a fetchUserContacts error',
    async () => {
      // Call getTestConfig to get the default configuration
      const [ethProvider, defaultOptions] = getTestConfig(
        providerWallet.privateKey
      );

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

  describe('use voucher', () => {
    beforeEach(async () => {
      // payable workerpool
      await createAndPublishWorkerpoolOrder(
        TEST_CHAIN.prodWorkerpool,
        TEST_CHAIN.prodWorkerpoolOwnerWallet,
        NULL_ADDRESS,
        workerpoolprice
      );
    });
    it(
      'should throw error if no voucher available for the requester',
      async () => {
        const params = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddressOrEns: debugWorkerpoolAddress,
          workerpoolMaxPrice: 1000,
          useVoucher: true,
        };
        let error;
        try {
          await web3mail.sendEmail(params);
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe(
          'Oops, it seems your wallet is not associated with any voucher. Check on https://builder-dashboard.iex.ec/'
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should throw error if workerpool is not sponsored by the voucher',
      async () => {
        const voucherType = await createVoucherType({
          description: 'test voucher type',
          duration: 60 * 60,
        });
        await createVoucher({
          owner: consumerWallet.address,
          voucherType,
          value: 1000,
        });
        const params = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddress: prodWorkerpoolAddress,
          workerpoolMaxPrice: 1000,
          useVoucher: true,
        };

        let error;
        try {
          await web3mail.sendEmail(params);
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe('Failed to sendEmail');
        expect(error.cause.message).toBe(
          `Orders can't be matched. Please approve an additional ${workerpoolprice} for voucher usage.`
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'throw error if voucher balance is insufficient to sponsor workerpool',
      async () => {
        // payable workerpool
        await createAndPublishWorkerpoolOrder(
          TEST_CHAIN.prodWorkerpool,
          TEST_CHAIN.prodWorkerpoolOwnerWallet,
          consumerWallet.address,
          workerpoolprice
        );
        const voucherType = await createVoucherType({
          description: 'test voucher type',
          duration: 60 * 60,
        });
        const voucherValue = 500;
        await createVoucher({
          owner: consumerWallet.address,
          voucherType,
          value: voucherValue,
        });
        await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);
        const params = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddress: prodWorkerpoolAddress,
          workerpoolMaxPrice: 1000,
          useVoucher: true,
        };
        const missingAmount = workerpoolprice - voucherValue;
        let error;
        try {
          await web3mail.sendEmail(params);
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe('Failed to sendEmail');
        expect(error.cause.message).toBe(
          `Orders can't be matched. Please approve an additional ${missingAmount} for voucher usage.`
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should create task if voucher balance is insufficient to sponsor workerpool and user approve missing amount',
      async () => {
        // payable workerpool
        await createAndPublishWorkerpoolOrder(
          TEST_CHAIN.prodWorkerpool,
          TEST_CHAIN.prodWorkerpoolOwnerWallet,
          consumerWallet.address,
          workerpoolprice
        );
        const voucherType = await createVoucherType({
          description: 'test voucher type',
          duration: 60 * 60,
        });
        const voucherValue = 500;
        const voucherAddress = await createVoucher({
          owner: consumerWallet.address,
          voucherType,
          value: voucherValue,
        });
        await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);
        const params = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddress: prodWorkerpoolAddress,
          workerpoolMaxPrice: 1000,
          useVoucher: true,
        };
        const missingAmount = workerpoolprice - voucherValue;
        await ensureSufficientStake(consumerIExecInstance, missingAmount);
        await consumerIExecInstance.account.approve(
          missingAmount,
          voucherAddress
        );

        const sendEmailResponse = await web3mail.sendEmail(params);
        expect(sendEmailResponse.taskId).toBeDefined();
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should create a deal for send email if voucher balance is sufficient to sponsor workerpool',
      async () => {
        // payable workerpool
        await createAndPublishWorkerpoolOrder(
          TEST_CHAIN.prodWorkerpool,
          TEST_CHAIN.prodWorkerpoolOwnerWallet,
          consumerWallet.address,
          workerpoolprice
        );
        const voucherType = await createVoucherType({
          description: 'test voucher type',
          duration: 60 * 60,
        });
        const voucherValue = 1000;
        await createVoucher({
          owner: consumerWallet.address,
          voucherType,
          value: voucherValue,
        });
        await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);
        const params = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: validProtectedData.address,
          workerpoolAddress: prodWorkerpoolAddress,
          workerpoolMaxPrice: 1000,
          useVoucher: true,
        };
        const sendEmailResponse = await web3mail.sendEmail(params);
        expect(sendEmailResponse.taskId).toBeDefined();
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
