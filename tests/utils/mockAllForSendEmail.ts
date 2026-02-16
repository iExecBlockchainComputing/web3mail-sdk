import { jest } from '@jest/globals';
import { Address } from 'iexec';
import { getRandomAddress, getRandomTxHash } from '../test-utils.js';

export function mockAllForSendEmail() {
  const randomDealId = getRandomTxHash();
  const randomTaskId = getRandomTxHash();
  return {
    wallet: {
      getAddress: jest
        .fn<() => Promise<Address>>()
        .mockResolvedValue(getRandomAddress()),
    },
    ens: {
      resolveName: jest
        .fn<() => Promise<Address>>()
        .mockResolvedValue(getRandomAddress()),
    },
    orderbook: {
      fetchDatasetOrderbook: jest
        .fn<() => Promise<{ orders: any[] }>>()
        .mockResolvedValue({
          orders: [{ order: { datasetprice: 0 } }],
        }),
      fetchAppOrderbook: jest
        .fn<() => Promise<{ orders: any[] }>>()
        .mockResolvedValue({
          orders: [{ order: { appprice: 0, tag: ['tee', 'scone'] } }],
        }),
      fetchWorkerpoolOrderbook: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          count: 1,
          nextPage: 1,
          orders: [{ order: { workerpoolprice: 0 } }],
        });
      }),
    },
    secrets: {
      pushRequesterSecret: jest
        .fn<() => Promise<boolean>>()
        .mockResolvedValue(true),
    },
    dataset: {
      generateEncryptionKey: jest
        .fn<() => string>()
        .mockReturnValue('encryptionKey'),
      encrypt: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue('encryptedFile'),
    },
    order: {
      createRequestorder: jest.fn(),
      signRequestorder: jest.fn(),
      matchOrders: jest
        .fn<
          () => Promise<{
            dealid: Address;
            txHash: string;
          }>
        >()
        .mockResolvedValue({
          dealid: randomDealId,
          txHash: getRandomTxHash(),
        }),
    },
    deal: {
      computeTaskId: jest
        .fn<() => Promise<Address>>()
        .mockResolvedValue(randomTaskId),
    },
  };
}
