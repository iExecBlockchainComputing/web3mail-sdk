import { describe, expect, it, jest } from '@jest/globals';
import { Address } from 'iexec';
import { type FetchMyContacts } from '../../src/web3mail/fetchMyContacts.js';
import { getRandomAddress } from '../test-utils.js';
import { DEFAULT_CHAIN_ID, getChainDefaultConfig } from '../../src/config/config.js';

jest.unstable_mockModule('../../src/utils/subgraphQuery.js', () => ({
  getValidContact: jest.fn(),
}));

describe('fetchMyContacts', () => {
  let testedModule: any;
  let fetchMyContacts: FetchMyContacts;

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import('../../src/web3mail/fetchMyContacts.js');
    fetchMyContacts = testedModule.fetchMyContacts;
  });

  const MOCK_ORDER = {
    order: {
      dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
      datasetprice: 0,
      volume: 10,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
      apprestrict: '0x0000000000000000000000000000000000000000',
      workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
      sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
    },
    orderHash:
      '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
    chainId: 134,
    publicationTimestamp: '2023-06-15T16:39:22.713Z',
    signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
    status: 'open',
    remaining: 10,
  };
  it('should fetch granted access without parameters (using default parameters)', async () => {
    // --- GIVEN
    const { getValidContact } = (await import(
      '../../src/utils/subgraphQuery.js'
    )) as unknown as { getValidContact: jest.Mock<() => Promise<[]>> };
    getValidContact.mockResolvedValue([]);

    const mockFetchDatasetOrderbook: any = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        count: 1,
        nextPage: 1,
        orders: [MOCK_ORDER],
      });
    });

    const iexec = {
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
        fetchDatasetOrderbook: mockFetchDatasetOrderbook,
      },
    };

    await fetchMyContacts({
      // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
      iexec: iexec,
      // @ts-expect-error No need for graphQLClient here
      graphQLClient: {},
      dappAddressOrENS: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
      dappWhitelistAddress: getChainDefaultConfig(DEFAULT_CHAIN_ID).whitelistSmartContract,
      isUserStrict: false,
    });
    const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      1,
      'any',
      {
        app: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress.toLowerCase(),
        requester: userAddress,
        isAppStrict: true,
        isRequesterStrict: false,
        pageSize: 1000,
      }
    );
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      2,
      'any',
      {
        app: getChainDefaultConfig(DEFAULT_CHAIN_ID).whitelistSmartContract.toLowerCase(),
        requester: userAddress,
        isAppStrict: true,
        isRequesterStrict: false,
        pageSize: 1000,
      }
    );
  });

  it('should fetch granted access with isRequesterStrict param equal to true', async () => {
    // --- GIVEN
    const { getValidContact } = (await import(
      '../../src/utils/subgraphQuery.js'
    )) as unknown as { getValidContact: jest.Mock<() => Promise<[]>> };
    getValidContact.mockResolvedValue([]);

    const mockFetchDatasetOrderbook: any = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        count: 1,
        nextPage: 1,
        orders: [MOCK_ORDER],
      });
    });

    const iexec = {
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
        fetchDatasetOrderbook: mockFetchDatasetOrderbook,
      },
    };

    await fetchMyContacts({
      // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
      iexec: iexec,
      // @ts-expect-error No need for graphQLClient here
      graphQLClient: {},
      dappAddressOrENS: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress,
      dappWhitelistAddress: getChainDefaultConfig(DEFAULT_CHAIN_ID).whitelistSmartContract.toLowerCase(),
      isUserStrict: true,
    });
    const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      1,
      'any',
      {
        app: getChainDefaultConfig(DEFAULT_CHAIN_ID).dappAddress.toLowerCase(),
        requester: userAddress,
        isAppStrict: true,
        isRequesterStrict: true,
        pageSize: 1000,
      }
    );
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      2,
      'any',
      {
        app: getChainDefaultConfig(DEFAULT_CHAIN_ID).whitelistSmartContract.toLowerCase(),
        requester: userAddress,
        isAppStrict: true,
        isRequesterStrict: true,
        pageSize: 1000,
      }
    );
  });
});
