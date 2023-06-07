import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExecWeb3Mail } from '../../dist/index';

describe('IExecWeb3Mail()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider: any = null;
    expect(() => new IExecWeb3Mail(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const web3Mail = new IExecWeb3Mail(
      getSignerFromPrivateKey('https://bellecour.iex.ec', wallet.privateKey)
    );
    expect(web3Mail).toBeInstanceOf(IExecWeb3Mail);
  });
});
