import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExecWeb3mail } from '../../src/index.js';

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
      getSignerFromPrivateKey('https://bellecour.iex.ec', wallet.privateKey)
    );
    expect(web3mail).toBeInstanceOf(IExecWeb3mail);
  });

  it('instantiates with custom web3Mail config options', async () => {
    const wallet = Wallet.createRandom();
    const web3mail = new IExecWeb3mail(
      getSignerFromPrivateKey('https://bellecour.iex.ec', wallet.privateKey),
      {
        iexecOptions: {
          smsURL: 'https://sms.scone-debug.stagingv8.iex.ec',
          iexecGatewayURL: 'https://api.market.stagingv8.iex.ec',
        },
        ipfsNode: 'https://example.com/node',
        ipfsGateway: 'https://example.com/ipfs_gateway',
        dataProtectorSubgraph: 'https://example.com/custom-subgraph',
        dappAddressOrENS: 'web3mailstg.apps.iexec.eth',
        dappWhitelistAddress: '0x781482C39CcE25546583EaC4957Fb7Bf04C277BB',
      }
    );
    expect(web3mail).toBeInstanceOf(IExecWeb3mail);
  });
});
