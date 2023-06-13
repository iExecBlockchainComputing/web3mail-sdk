import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { IExecWeb3mail } from '../../dist/index';

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
});
