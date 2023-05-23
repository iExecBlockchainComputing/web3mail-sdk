import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecWeb3Mail } from '../../dist/index';
import { getEthProvider } from '../test-utils';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: Wallet;
  let web3mail: IExecWeb3Mail;

  wallet = Wallet.createRandom();
  web3mail = new IExecWeb3Mail(getEthProvider(wallet.privateKey));

  it('pass with a regular call', async () => {
    const res = await web3mail.fetchMyContacts();
    expect(res).toBeDefined();
  }, 30_000);
});
