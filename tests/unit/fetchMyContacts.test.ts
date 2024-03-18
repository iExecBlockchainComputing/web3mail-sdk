import { describe, expect, it, jest } from '@jest/globals';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { getWeb3Provider } from '@iexec/dataprotector';
import { Wallet } from 'ethers';
import {
  DATAPROTECTOR_SUBGRAPH_ENDPOINT,
  WEB3_MAIL_DAPP_ADDRESS,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../../src/config/config.js';
import { fetchMyContacts } from '../../src/web3mail/fetchMyContacts.js';

describe('fetchMyContacts', () => {
  it('should fetch contacts with the specified page and page size', async () => {
    const graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);
    const iexec = new IExec({
      ethProvider,
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
    const mockFetchDatasetOrderbook: any = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        count: 1,
        nextPage: 1,
        orders: [MOCK_ORDER],
      });
    });
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;

    await fetchMyContacts({
      iexec: iexec,
      dappAddressOrENS: WEB3_MAIL_DAPP_ADDRESS,
      dappWhitelistAddress: WHITELIST_SMART_CONTRACT_ADDRESS,
      graphQLClient,
    });
    const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      1,
      'any',
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
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
        app: WHITELIST_SMART_CONTRACT_ADDRESS.toLowerCase(),
        requester: userAddress,
        isAppStrict: true,
        isRequesterStrict: true,
        pageSize: 1000,
      }
    );
  });
});
