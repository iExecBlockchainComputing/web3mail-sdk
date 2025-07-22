/* eslint-disable @typescript-eslint/dot-notation */
// needed to access and assert IExecDataProtector's private properties
import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { getWeb3Provider, IExecWeb3mail } from '../../src/index.js';
import {
  getTestWeb3SignerProvider,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../test-utils.js';
import {
  DEFAULT_CHAIN_ID,
  getChainDefaultConfig,
} from '../../src/config/config.js';

describe('IExecWeb3mail()', () => {
  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    await web3mail.init();
    expect(web3mail).toBeInstanceOf(IExecWeb3mail);
  });

  it('should use default ipfs gateway url when ipfsGateway is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    await web3mail.init();
    const ipfsGateway = web3mail['ipfsGateway'];
    const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
    expect(defaultConfig).not.toBeNull();
    expect(ipfsGateway).toStrictEqual(defaultConfig!.ipfsGateway);
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
    await web3mail.init();
    const ipfsGateway = web3mail['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
  });

  it('should use default data Protector Subgraph URL when subgraphUrl is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    await web3mail.init();
    const graphQLClient = web3mail['graphQLClient'];
    const defaultConfig = getChainDefaultConfig(DEFAULT_CHAIN_ID);
    expect(defaultConfig).not.toBeNull();
    expect(graphQLClient['url']).toBe(defaultConfig!.dataProtectorSubgraph);
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
    await web3mail.init();
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
    await web3mail.init();
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
    expect(whitelistAddress).toStrictEqual(
      customDappWhitelistAddress.toLowerCase()
    );
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
    expect(await iexec.config.resolveIexecGatewayURL()).toBe(iexecGatewayURL);
  });

  it(
    'When calling a read method should work as expected',
    async () => {
      // --- GIVEN
      const web3mail = new IExecWeb3mail();
      await web3mail.init();
      const wallet = Wallet.createRandom();

      // --- WHEN/THEN
      await expect(
        web3mail.fetchUserContacts({ userAddress: wallet.address })
      ).resolves.not.toThrow();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('When instantiating SDK with an experimental network', () => {
    const experimentalNetworkSigner = getWeb3Provider(
      Wallet.createRandom().privateKey,
      {
        host: 421614,
        allowExperimentalNetworks: true,
      }
    );

    describe('Without allowExperimentalNetworks', () => {
      it('should throw a configuration error', async () => {
        const web3mail = new IExecWeb3mail(experimentalNetworkSigner);
        await expect(web3mail.init()).rejects.toThrow(
          'Missing required configuration for chainId 421614: dataProtectorSubgraph, dappAddress, whitelistSmartContract, ipfsGateway, prodWorkerpoolAddress, ipfsUploadUrl'
        );
      });
    });

    describe('With allowExperimentalNetworks: true', () => {
      it('should resolve the configuration', async () => {
        const web3mail = new IExecWeb3mail(experimentalNetworkSigner, {
          allowExperimentalNetworks: true,
        });
        await expect(web3mail.init()).resolves.toBeUndefined();
        expect(web3mail).toBeInstanceOf(IExecWeb3mail);
      });

      it('should use Arbitrum Sepolia default configuration', async () => {
        const web3mail = new IExecWeb3mail(experimentalNetworkSigner, {
          allowExperimentalNetworks: true,
        });
        await web3mail.init();

        const arbitrumSepoliaConfig = getChainDefaultConfig(421614, {
          allowExperimentalNetworks: true,
        });
        expect(arbitrumSepoliaConfig).not.toBeNull();

        expect(web3mail['ipfsGateway']).toBe(
          arbitrumSepoliaConfig!.ipfsGateway
        );
        expect(web3mail['ipfsNode']).toBe(arbitrumSepoliaConfig!.ipfsUploadUrl);
        expect(web3mail['dappAddressOrENS']).toBe(
          arbitrumSepoliaConfig!.dappAddress
        );
        expect(web3mail['dappWhitelistAddress']).toBe(
          arbitrumSepoliaConfig!.whitelistSmartContract.toLowerCase()
        );
        expect(web3mail['defaultWorkerpool']).toBe(
          arbitrumSepoliaConfig!.prodWorkerpoolAddress
        );
        expect(web3mail['graphQLClient']['url']).toBe(
          arbitrumSepoliaConfig!.dataProtectorSubgraph
        );
      });

      it('should allow custom configuration override for Arbitrum Sepolia', async () => {
        const customIpfsGateway = 'https://custom-arbitrum-ipfs.com';
        const customDappAddress = 'custom.arbitrum.app.eth';

        const web3mail = new IExecWeb3mail(experimentalNetworkSigner, {
          allowExperimentalNetworks: true,
          ipfsGateway: customIpfsGateway,
          dappAddressOrENS: customDappAddress,
        });
        await web3mail.init();

        expect(web3mail['ipfsGateway']).toBe(customIpfsGateway);
        expect(web3mail['dappAddressOrENS']).toBe(customDappAddress);

        const arbitrumSepoliaConfig = getChainDefaultConfig(421614, {
          allowExperimentalNetworks: true,
        });
        expect(arbitrumSepoliaConfig).not.toBeNull();
        expect(web3mail['ipfsNode']).toBe(arbitrumSepoliaConfig!.ipfsUploadUrl);
        expect(web3mail['dappWhitelistAddress']).toBe(
          arbitrumSepoliaConfig!.whitelistSmartContract.toLowerCase()
        );
        expect(web3mail['defaultWorkerpool']).toBe(
          arbitrumSepoliaConfig!.prodWorkerpoolAddress
        );
        expect(web3mail['graphQLClient']['url']).toBe(
          arbitrumSepoliaConfig!.dataProtectorSubgraph
        );
      });
    });
  });
});
