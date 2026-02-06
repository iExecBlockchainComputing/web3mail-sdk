import { expect, it, jest } from '@jest/globals';
import { ValidationError } from 'yup';
import { type SendEmail } from '../../src/web3mail/sendEmail.js';
import { getRandomAddress, TEST_CHAIN } from '../test-utils.js';
import { mockAllForSendEmail } from '../utils/mockAllForSendEmail.js';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  checkProtectedDataValidity: jest.fn(),
}));

describe('sendEmail', () => {
  let testedModule: any;
  let sendEmail: SendEmail;

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import('../../src/web3mail/sendEmail.js');
    sendEmail = testedModule.sendEmail;
  });

  describe('Check validation for input parameters', () => {
    describe('When senderName is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          senderName: 'AB', // <--
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('senderName must be at least 3 characters')
        );
      });
    });

    describe('When senderName is more than 20 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          senderName: 'A very long sender name', // <-- 23 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('senderName must be at most 20 characters')
        );
      });
    });

    describe('When label is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          label: 'ID', // <-- 23 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('label must be at least 3 characters')
        );
      });
    });

    describe('When label is more than 10 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          label: 'ID123456789', // <-- 11 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('label must be at most 10 characters')
        );
      });
    });

    describe('When emailContent is more than 512kb (too big)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const desiredSizeInBytes = 520000; // 520 kilo-bytes
        const characterToRepeat = 'A';
        const OVERSIZED_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: OVERSIZED_CONTENT,
          protectedData: getRandomAddress(),
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('emailContent must be at most 512000 characters')
        );
      });
    });
  });

  describe('Orders fetching', () => {
    it('should call fetchWorkerpoolOrderbook for App & Whitelist', async () => {
      // --- GIVEN
      const { checkProtectedDataValidity } = (await import(
        '../../src/utils/subgraphQuery.js'
      )) as unknown as {
        checkProtectedDataValidity: jest.Mock<() => Promise<boolean>>;
      };
      checkProtectedDataValidity.mockResolvedValue(true);

      const OVERSIZED_CONTENT = 'Test';
      const protectedData = getRandomAddress().toLowerCase();
      const iexec = mockAllForSendEmail();

      const userAddress = await iexec.wallet.getAddress();

      // --- WHEN
      await sendEmail({
        // @ts-expect-error No need for graphQLClient here
        graphQLClient: {},
        // @ts-expect-error No need for iexec here
        iexec,
        ipfsGateway: getChainDefaultConfig(DEFAULT_CHAIN_ID)?.ipfsGateway,
        ipfsNode: getChainDefaultConfig(DEFAULT_CHAIN_ID)?.ipfsUploadUrl,
        workerpoolAddressOrEns:
          getChainDefaultConfig(DEFAULT_CHAIN_ID)?.prodWorkerpoolAddress,
        dappAddressOrENS: getChainDefaultConfig(DEFAULT_CHAIN_ID)?.dappAddress,
        dappWhitelistAddress:
          getChainDefaultConfig(
            DEFAULT_CHAIN_ID
          )?.whitelistSmartContract.toLowerCase(),
        emailSubject: 'e2e mail object for test',
        emailContent: OVERSIZED_CONTENT,
        protectedData,
      });

      // --- THEN
      const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
      expect(defaultConfig).not.toBeNull();
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        1,
        {
          workerpool: TEST_CHAIN.prodWorkerpool,
          app: defaultConfig!.dappAddress.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          isRequesterStrict: false,
          minTag: ['tee', 'scone'],
          category: 0,
        }
      );
      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        2,
        {
          workerpool: TEST_CHAIN.prodWorkerpool,
          app: defaultConfig!.whitelistSmartContract.toLowerCase(),
          dataset: protectedData,
          requester: userAddress,
          isRequesterStrict: false,
          minTag: ['tee', 'scone'],
          category: 0,
        }
      );
    });
  });
});
