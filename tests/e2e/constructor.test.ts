/* eslint-disable @typescript-eslint/dot-notation */
// needed to access and assert IExecDataProtector's private properties
import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import {
  DATAPROTECTOR_SUBGRAPH_ENDPOINT,
  DEFAULT_IPFS_GATEWAY,
} from '../../src/config/config.js';
import { IExecWeb3mail } from '../../src/index.js';
import { getTestWeb3SignerProvider } from '../test-utils.js';

describe('IExecWeb3mail()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider: any = null;
    expect(() => new IExecWeb3mail(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    expect(web3mail).toBeInstanceOf(IExecWeb3mail);
  });

  it('should use default ipfs gateway url when ipfsGateway is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    const ipfsGateway = web3mail['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(DEFAULT_IPFS_GATEWAY);
  });

  it('should use provided ipfs gateway url when ipfsGateway is provided', async () => {
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        ipfsGateway: customIpfsGateway,
      }
    );
    const ipfsGateway = web3mail['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
  });

  it('should use default data Protector Subgraph URL when subgraphUrl is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    const graphQLClientUrl = web3mail['graphQLClient'];
    expect(graphQLClientUrl['url']).toBe(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
  });

  it('should use provided data Protector Subgraph URL when subgraphUrl is provided', async () => {
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        dataProtectorSubgraph: customSubgraphUrl,
      }
    );
    const graphQLClient = web3mail['graphQLClient'];
    expect(graphQLClient['url']).toBe(customSubgraphUrl);
  });

  it('instantiates with custom web3Mail config options', async () => {
    const wallet = Wallet.createRandom();
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const customDapp = 'web3mailstg.apps.iexec.eth';
    const customIpfsNode = 'https://example.com/node';
    const smsURL = 'https://custom-sms-url.com';
    const iexecGatewayURL = 'https://custom-market-api-url.com';
    const customDappWhitelistAddress =
      '0x781482C39CcE25546583EaC4957Fb7Bf04C277BB';
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        iexecOptions: {
          smsURL,
          iexecGatewayURL,
        },
        ipfsNode: customIpfsNode,
        ipfsGateway: customIpfsGateway,
        dataProtectorSubgraph: customSubgraphUrl,
        dappAddressOrENS: customDapp,
        dappWhitelistAddress: customDappWhitelistAddress,
      }
    );
    const graphQLClient = web3mail['graphQLClient'];
    const ipfsNode = web3mail['ipfsNode'];
    const ipfsGateway = web3mail['ipfsGateway'];
    const dappAddressOrENS = web3mail['dappAddressOrENS'];
    const iexec = web3mail['iexec'];
    const whitelistAddress = web3mail['dappWhitelistAddress'];

    expect(graphQLClient['url']).toBe(customSubgraphUrl);
    expect(ipfsNode).toStrictEqual(customIpfsNode);
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
    expect(dappAddressOrENS).toStrictEqual(customDapp);
    expect(whitelistAddress).toStrictEqual(customDappWhitelistAddress);
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
    expect(await iexec.config.resolveIexecGatewayURL()).toBe(iexecGatewayURL);
  });
});
