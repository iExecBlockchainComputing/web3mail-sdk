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
  MAX_EXPECTED_SUBGRAPH_INDEXING_TIME,
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
  let learnProdWorkerpoolAddress: string;
  const iexecOptions = getTestIExecOption();
  const prodWorkerpoolPublicPrice = 1000;

  beforeAll(async () => {
    // (default) prod workerpool (not free) always available
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      1_000,
      prodWorkerpoolPublicPrice
    );
    // learn prod pool (free) assumed always available
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.learnProdWorkerpool,
      TEST_CHAIN.learnProdWorkerpoolOwnerWallet,
      NULL_ADDRESS,
      0,
      10_000
    );
    // apporder always available
    providerWallet = getRandomWallet();
    const ethProvider = getTestWeb3SignerProvider(
      TEST_CHAIN.appOwnerWallet.privateKey
    );
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    await createAndPublishAppOrders(resourceProvider, WEB3_MAIL_DAPP_ADDRESS);

    learnProdWorkerpoolAddress = await resourceProvider.ens.resolveName(
      TEST_CHAIN.learnProdWorkerpool
    );
    prodWorkerpoolAddress = await resourceProvider.ens.resolveName(
      TEST_CHAIN.prodWorkerpool
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
    // use a fresh wallet for calling sendEmail
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
          expect(sendEmailResponse.taskId).toBeDefined();
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
          workerpoolAddressOrEns: learnProdWorkerpoolAddress,
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
          workerpoolAddressOrEns: learnProdWorkerpoolAddress,
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
          workerpoolAddressOrEns: learnProdWorkerpoolAddress,
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
    'should successfully send email when using a free prod workerpool',
    async () => {
      const sendEmailResponse = await web3mail.sendEmail({
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: validProtectedData.address,
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
      });
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

      const sendEmailResponse = await web3mail.sendEmail({
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData: protectedDataForWhitelist.address,
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
      });
      expect(sendEmailResponse.taskId).toBeDefined();
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
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
      });
      expect(sendEmailResponse.taskId).toBeDefined();
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
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
      });
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

      const sendEmailResponse = await web3mail.sendEmail({
        emailSubject: 'e2e mail object for test',
        emailContent: LARGE_CONTENT,
        protectedData: validProtectedData.address,
        senderName: 'Product Team',
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
      });
      expect(sendEmailResponse.taskId).toBeDefined();
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
        workerpoolAddressOrEns: learnProdWorkerpoolAddress,
        label: 'ID1234678',
      });
      expect(sendEmailResponse.taskId).toBeDefined();
      // TODO check label in created deal
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('when useVoucher:true', () => {
    it(
      'should throw error if no voucher available for the requester',
      async () => {
        let error;
        try {
          await web3mail.sendEmail({
            emailSubject: 'e2e mail object for test',
            emailContent: 'e2e mail content for test',
            protectedData: validProtectedData.address,
            workerpoolAddressOrEns: learnProdWorkerpoolAddress,
            workerpoolMaxPrice: 1000,
            useVoucher: true,
          });
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

        let error;
        try {
          await web3mail.sendEmail({
            emailSubject: 'e2e mail object for test',
            emailContent: 'e2e mail content for test',
            protectedData: validProtectedData.address,
            // workerpoolAddressOrEns: prodWorkerpoolAddress, // default
            workerpoolMaxPrice: 1000,
            useVoucher: true,
          });
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe('Failed to sendEmail');
        expect(error.cause.message).toBe(
          'Found some workerpool orders but none can be sponsored by your voucher.'
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    describe('when voucher balance covers the full workerpool price', () => {
      it(
        'should create a deal for send email',
        async () => {
          // payable workerpool
          const voucherType = await createVoucherType({
            description: 'test voucher type',
            duration: 60 * 60,
          });
          await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);
          const voucherValue = 1000;
          await createVoucher({
            owner: consumerWallet.address,
            voucherType,
            value: voucherValue,
          });
          await waitSubgraphIndexing();

          const sendEmailResponse = await web3mail.sendEmail({
            emailSubject: 'e2e mail object for test',
            emailContent: 'e2e mail content for test',
            protectedData: validProtectedData.address,
            // workerpoolAddressOrEns: prodWorkerpoolAddress, // default
            useVoucher: true,
          });
          expect(sendEmailResponse.taskId).toBeDefined();
        },
        2 * MAX_EXPECTED_BLOCKTIME +
          MAX_EXPECTED_WEB2_SERVICES_TIME +
          MAX_EXPECTED_SUBGRAPH_INDEXING_TIME
      );
    });

    describe('when voucher balance does not cover the full workerpool price', () => {
      describe('but workerpoolMaxPrice covers the non sponsored amount', () => {
        it(
          'let call iexec.matchOrders',
          async () => {
            const voucherType = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);

            const voucherRemainingValue = 500;
            const workerpoolOrderPrice = 600;
            const nonSponsoredAmount =
              workerpoolOrderPrice - voucherRemainingValue;

            // voucher with balance insufficient to cover workerpool price
            await Promise.all([
              createVoucher({
                owner: consumerWallet.address,
                voucherType,
                value: voucherRemainingValue,
                skipOrders: true,
              }),
              createAndPublishWorkerpoolOrder(
                TEST_CHAIN.prodWorkerpool,
                TEST_CHAIN.prodWorkerpoolOwnerWallet,
                consumerWallet.address,
                workerpoolOrderPrice
              ),
            ]);
            await waitSubgraphIndexing();

            let error;
            try {
              await web3mail.sendEmail({
                emailSubject: 'e2e mail object for test',
                emailContent: 'e2e mail content for test',
                protectedData: validProtectedData.address,
                // workerpoolAddressOrEns: prodWorkerpoolAddress, // default
                workerpoolMaxPrice: nonSponsoredAmount,
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe('Failed to sendEmail');
            expect(error.cause.message).toBe(
              `Orders can't be matched. Please approve an additional ${nonSponsoredAmount} for voucher usage.`
            );
          },
          2 * MAX_EXPECTED_BLOCKTIME +
            MAX_EXPECTED_WEB2_SERVICES_TIME +
            MAX_EXPECTED_SUBGRAPH_INDEXING_TIME
        );
        it(
          'should create task if user approves the non sponsored amount',
          async () => {
            const voucherType = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);

            const voucherRemainingValue = 500;
            const workerpoolOrderPrice = 600;
            const nonSponsoredAmount =
              workerpoolOrderPrice - voucherRemainingValue;

            // voucher with balance insufficient to cover workerpool price
            const [voucherAddress] = await Promise.all([
              createVoucher({
                owner: consumerWallet.address,
                voucherType,
                value: voucherRemainingValue,
                skipOrders: true,
              }),
              createAndPublishWorkerpoolOrder(
                TEST_CHAIN.prodWorkerpool,
                TEST_CHAIN.prodWorkerpoolOwnerWallet,
                consumerWallet.address,
                workerpoolOrderPrice
              ),
            ]);
            await waitSubgraphIndexing();
            await ensureSufficientStake(
              consumerIExecInstance,
              nonSponsoredAmount
            );
            await consumerIExecInstance.account.approve(
              nonSponsoredAmount,
              voucherAddress
            );
            const sendEmailResponse = await web3mail.sendEmail({
              emailSubject: 'e2e mail object for test',
              emailContent: 'e2e mail content for test',
              protectedData: validProtectedData.address,
              // workerpoolAddressOrEns: prodWorkerpoolAddress, // default
              workerpoolMaxPrice: nonSponsoredAmount,
              useVoucher: true,
            });
            expect(sendEmailResponse.taskId).toBeDefined();
          },
          2 * MAX_EXPECTED_BLOCKTIME +
            MAX_EXPECTED_WEB2_SERVICES_TIME +
            MAX_EXPECTED_SUBGRAPH_INDEXING_TIME
        );
      });
      describe('and workerpoolMaxPrice does NOT covers the non sponsored amount', () => {
        it(
          'should throws an error No Workerpool order found for the desired price',
          async () => {
            const voucherType = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            await addVoucherEligibleAsset(prodWorkerpoolAddress, voucherType);

            const voucherRemainingValue = 500;
            const workerpoolOrderPrice = 600;

            // voucher with balance insufficient to cover workerpool price
            await Promise.all([
              createVoucher({
                owner: consumerWallet.address,
                voucherType,
                value: voucherRemainingValue,
                skipOrders: true,
              }),
              createAndPublishWorkerpoolOrder(
                TEST_CHAIN.prodWorkerpool,
                TEST_CHAIN.prodWorkerpoolOwnerWallet,
                consumerWallet.address,
                workerpoolOrderPrice
              ),
            ]);
            await waitSubgraphIndexing();

            let error;
            try {
              await web3mail.sendEmail({
                emailSubject: 'e2e mail object for test',
                emailContent: 'e2e mail content for test',
                protectedData: validProtectedData.address,
                // workerpoolAddressOrEns: prodWorkerpoolAddress, // default
                // workerpoolMaxPrice: 0, // default
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe('Failed to sendEmail');
            expect(error.cause.message).toBe(
              `No Workerpool order found for the desired price`
            );
          },
          2 * MAX_EXPECTED_BLOCKTIME +
            MAX_EXPECTED_WEB2_SERVICES_TIME +
            MAX_EXPECTED_SUBGRAPH_INDEXING_TIME
        );
      });
    });
  });
});
