import { expect, it, jest } from '@jest/globals';

import { type SendEmail } from '../../src/web3mail/sendEmail.js';
import { getRandomAddress } from '../test-utils.js';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';
import { mockAllForSendEmail } from '../utils/mockAllForSendEmail.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  checkProtectedDataValidity: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/ipfs-service.js', () => ({
  add: jest.fn(() =>
    Promise.resolve('QmSBoN71925mWJ6acehqDLQrrxihxX55EXrqHxpYja4HCG')
  ),
  get: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
}));

jest.unstable_mockModule('@iexec/dataprotector', () => ({
  IExecDataProtectorCore: jest.fn(),
}));

describe('sendEmail', () => {
  let testedModule: any;
  let sendEmail: SendEmail;
  const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);

  const mockDataProtector = {
    processProtectedData: jest
      .fn()
      .mockResolvedValue({ taskId: 'task123' } as never),
  };

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
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            senderName: 'AB', // Trop court, déclenche l'erreur Yup
            ...sendEmailParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'senderName must be at least 3 characters',
            ]),
          }),
        });
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
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            senderName: 'A very long sender name',
            ...sendEmailParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'senderName must be at most 20 characters',
            ]),
          }),
        });
      });
    });

    describe('When label is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          label: 'ID', // <-- 2 characters
        };

        await expect(
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            ...sendEmailParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'label must be at least 3 characters',
            ]),
          }),
        });
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
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            ...sendEmailParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'label must be at most 10 characters',
            ]),
          }),
        });
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
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataProtector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            ...sendEmailParams,
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
            errors: expect.arrayContaining([
              'emailContent must be at most 512000 characters',
            ]),
          }),
        });
      });
    });
  });

  describe('Orders fetching', () => {
    it('should call processProtectedData from dataProtector', async () => {
      //  --- GIVEN
      const { checkProtectedDataValidity } = (await import(
        '../../src/utils/subgraphQuery.js'
      )) as unknown as {
        checkProtectedDataValidity: jest.Mock<() => Promise<boolean>>;
      };

      checkProtectedDataValidity.mockResolvedValue(true);

      const protectedData = getRandomAddress().toLowerCase();

      const iexec = mockAllForSendEmail() as any;

      // --- WHEN
      await sendEmail({
        graphQLClient: { request: jest.fn() } as any,
        iexec,
        dataProtector: mockDataProtector as any,
        workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
        dappAddressOrENS: defaultConfig.dappAddress,
        dappWhitelistAddress: defaultConfig.whitelistSmartContract,
        ipfsNode: defaultConfig.ipfsUploadUrl,
        ipfsGateway: defaultConfig.ipfsGateway,
        emailSubject: 'e2e mail object for test',
        emailContent: 'e2e mail content for test',
        protectedData,
      });

      // --- THEN
      expect(mockDataProtector.processProtectedData).toHaveBeenCalledTimes(1);
      expect(mockDataProtector.processProtectedData).toHaveBeenCalledWith(
        expect.objectContaining({
          protectedData: protectedData,
          app: defaultConfig.dappAddress,
          workerpool: defaultConfig.prodWorkerpoolAddress,
        })
      );
    });

    describe('Bulk processing', () => {
      it('should call prepareBulkRequest and processBulkRequest when grantedAccess is provided', async () => {
        // --- GIVEN
        const mockBulkRequest = {
          bulkRequest: {
            bulkRequestAddress: '0x1234567890123456789012345678901234567890',
          },
        };

        const mockResponse = {
          tasks: ['mock-task-id-1', 'mock-task-id-2'],
        };

        const mockDataprotector = {
          prepareBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockBulkRequest),
          processBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockResponse),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN
        const result = await sendEmail({
          graphQLClient: { request: jest.fn() } as any,
          iexec: mockAllForSendEmail() as any,
          dataProtector: mockDataprotector as any,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          dappAddressOrENS: defaultConfig.dappAddress,
          dappWhitelistAddress: defaultConfig.whitelistSmartContract,
          ipfsNode: defaultConfig.ipfsUploadUrl,
          ipfsGateway: defaultConfig.ipfsGateway,
          emailSubject: 'bulk test',
          emailContent: 'bulk test content',
          grantedAccess,
          maxProtectedDataPerTask: 2,
        });

        // --- THEN
        expect(mockDataprotector.processProtectedData).not.toHaveBeenCalled();
        expect(mockDataprotector.prepareBulkRequest).toHaveBeenCalledTimes(1);
        expect(mockDataprotector.prepareBulkRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            app: defaultConfig.dappAddress,
            workerpool: defaultConfig.prodWorkerpoolAddress,
            bulkOrders: grantedAccess,
            maxProtectedDataPerTask: 2,
          })
        );
        expect(mockDataprotector.processBulkRequest).toHaveBeenCalledTimes(1);
        expect(mockDataprotector.processBulkRequest).toHaveBeenCalledWith({
          bulkRequest: mockBulkRequest.bulkRequest,
          useVoucher: false,
          workerpool: defaultConfig.prodWorkerpoolAddress,
        });
        expect(result).toEqual(mockResponse);
        expect('tasks' in result).toBe(true);
      });

      it('should validate maxProtectedDataPerTask when grantedAccess is provided', async () => {
        // --- GIVEN
        const mockDataprotector = {
          prepareBulkRequest: jest.fn(),
          processBulkRequest: jest.fn(),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN & THEN
        await expect(
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataprotector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            emailSubject: 'bulk test',
            emailContent: 'bulk test content',
            grantedAccess,
            maxProtectedDataPerTask: -1, // Invalid negative value
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.objectContaining({
            name: 'ValidationError',
          }),
        });
      });

      it('should validate maxProtectedDataPerTask is required when grantedAccess is provided', async () => {
        // --- GIVEN
        const mockDataprotector = {
          prepareBulkRequest: jest.fn(),
          processBulkRequest: jest.fn(),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN & THEN
        await expect(
          sendEmail({
            graphQLClient: { request: jest.fn() } as any,
            iexec: mockAllForSendEmail() as any,
            dataProtector: mockDataprotector as any,
            workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
            dappAddressOrENS: defaultConfig.dappAddress,
            dappWhitelistAddress: defaultConfig.whitelistSmartContract,
            ipfsNode: defaultConfig.ipfsUploadUrl,
            ipfsGateway: defaultConfig.ipfsGateway,
            emailSubject: 'bulk test',
            emailContent: 'bulk test content',
            grantedAccess,
            // maxProtectedDataPerTask is not provided
          })
        ).rejects.toMatchObject({
          message: 'Failed to sendEmail',
          cause: expect.anything(),
        });
      });

      it('should return ProcessBulkRequestResponse when grantedAccess is processed', async () => {
        // --- GIVEN
        const mockBulkRequest = {
          bulkRequest: {
            bulkRequestAddress: '0x1234567890123456789012345678901234567890',
          },
        };

        const mockResponse = {
          tasks: ['task-1', 'task-2', 'task-3'],
        };

        const mockDataprotector = {
          prepareBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockBulkRequest),
          processBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockResponse),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN
        const result = await sendEmail({
          graphQLClient: { request: jest.fn() } as any,
          iexec: mockAllForSendEmail() as any,
          dataProtector: mockDataprotector as any,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          dappAddressOrENS: defaultConfig.dappAddress,
          dappWhitelistAddress: defaultConfig.whitelistSmartContract,
          ipfsNode: defaultConfig.ipfsUploadUrl,
          ipfsGateway: defaultConfig.ipfsGateway,
          emailSubject: 'bulk test',
          emailContent: 'bulk test content',
          grantedAccess,
          maxProtectedDataPerTask: 1,
        });

        // --- THEN
        expect(result).toEqual(mockResponse);
        expect('tasks' in result).toBe(true);
        const tasks = 'tasks' in result ? result.tasks : [];
        expect(tasks.length).toBe(3);
      });

      it('should use single processing when grantedAccess is not provided', async () => {
        // --- GIVEN
        const { checkProtectedDataValidity } = (await import(
          '../../src/utils/subgraphQuery.js'
        )) as unknown as {
          checkProtectedDataValidity: jest.Mock<() => Promise<boolean>>;
        };

        checkProtectedDataValidity.mockResolvedValue(true);

        const protectedData = getRandomAddress();

        const mockDataprotector = {
          prepareBulkRequest: jest.fn(),
          processBulkRequest: jest.fn(),
          processProtectedData: jest
            .fn()
            .mockResolvedValue({ taskId: 'task123' } as never),
        } as any;

        // --- WHEN
        const result = await sendEmail({
          graphQLClient: { request: jest.fn() } as any,
          iexec: mockAllForSendEmail() as any,
          dataProtector: mockDataprotector as any,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          dappAddressOrENS: defaultConfig.dappAddress,
          dappWhitelistAddress: defaultConfig.whitelistSmartContract,
          ipfsNode: defaultConfig.ipfsUploadUrl,
          ipfsGateway: defaultConfig.ipfsGateway,
          emailSubject: 'single test',
          emailContent: 'single test content',
          protectedData,
        });

        // --- THEN
        expect(mockDataprotector.prepareBulkRequest).not.toHaveBeenCalled();
        expect(mockDataprotector.processBulkRequest).not.toHaveBeenCalled();
        expect(mockDataprotector.processProtectedData).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ taskId: 'task123' });
        expect('taskId' in result).toBe(true);
      });

      it('should work without protectedData when grantedAccess is provided', async () => {
        // --- GIVEN
        const mockBulkRequest = {
          bulkRequest: {
            bulkRequestAddress: '0x1234567890123456789012345678901234567890',
          },
        };

        const mockResponse = {
          tasks: ['task-1'],
        };

        const mockDataprotector = {
          prepareBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockBulkRequest),
          processBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockResponse),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN
        const result = await sendEmail({
          graphQLClient: { request: jest.fn() } as any,
          iexec: mockAllForSendEmail() as any,
          dataProtector: mockDataprotector as any,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          dappAddressOrENS: defaultConfig.dappAddress,
          dappWhitelistAddress: defaultConfig.whitelistSmartContract,
          ipfsNode: defaultConfig.ipfsUploadUrl,
          ipfsGateway: defaultConfig.ipfsGateway,
          emailSubject: 'bulk test',
          emailContent: 'bulk test content',
          // protectedData is not provided
          grantedAccess,
          maxProtectedDataPerTask: 1,
        });

        // --- THEN
        expect(mockDataprotector.prepareBulkRequest).toHaveBeenCalledTimes(1);
        expect(mockDataprotector.processBulkRequest).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockResponse);
        expect('tasks' in result).toBe(true);
      });

      it('should pass useVoucher correctly to processBulkRequest', async () => {
        // --- GIVEN
        const mockBulkRequest = {
          bulkRequest: {
            bulkRequestAddress: '0x1234567890123456789012345678901234567890',
          },
        };

        const mockResponse = {
          tasks: ['task-1'],
        };

        const mockDataprotector = {
          prepareBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockBulkRequest),
          processBulkRequest: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockResponse),
          processProtectedData: jest.fn(),
        } as any;

        const grantedAccess = [
          {
            dataset: getRandomAddress(),
            datasetprice: '0',
            volume: '1',
            tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
            apprestrict: defaultConfig.dappAddress,
            workerpoolrestrict: '0x0000000000000000000000000000000000000000',
            requesterrestrict: '0x0000000000000000000000000000000000000000',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
            remainingAccess: 1,
          },
        ];

        // --- WHEN
        await sendEmail({
          graphQLClient: { request: jest.fn() } as any,
          iexec: mockAllForSendEmail() as any,
          dataProtector: mockDataprotector as any,
          workerpoolAddressOrEns: defaultConfig.prodWorkerpoolAddress,
          dappAddressOrENS: defaultConfig.dappAddress,
          dappWhitelistAddress: defaultConfig.whitelistSmartContract,
          ipfsNode: defaultConfig.ipfsUploadUrl,
          ipfsGateway: defaultConfig.ipfsGateway,
          emailSubject: 'bulk test',
          emailContent: 'bulk test content',
          grantedAccess,
          maxProtectedDataPerTask: 1,
          useVoucher: true,
        });

        // --- THEN
        expect(mockDataprotector.processBulkRequest).toHaveBeenCalledWith({
          bulkRequest: mockBulkRequest.bulkRequest,
          useVoucher: true,
          workerpool: defaultConfig.prodWorkerpoolAddress,
        });
      });
    });
  });
});
