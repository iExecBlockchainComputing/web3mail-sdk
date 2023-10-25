import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { getWeb3Provider } from '../../dist/index';
import { EnhancedWallet } from 'iexec';

jest.unstable_mockModule('../../dist/web3mail/fetchUserContacts', () => ({
  default: {
    fetchUserContacts: jest.fn(),
  },
}));

// dynamically import tested module after all mock are loaded
const { IExecWeb3mail } = await import('../../dist/index');

const { fetchUserContacts } = await import(
  '../../dist/web3mail/fetchUserContacts'
);

describe('web3mail.fetchMyContacts()', () => {
  let wallet: Wallet;
  let web3mail: any;
  let ethProvider: EnhancedWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    ethProvider = getWeb3Provider(wallet.privateKey);
    web3mail = new IExecWeb3mail(ethProvider);
  }, 30_000);

  it('fetchMyContacts should call fetchUserContacts with the correct param', async () => {
    await web3mail.fetchMyContacts();

    expect(fetchUserContacts).toHaveBeenCalledTimes(1);
    expect(fetchUserContacts).toHaveBeenCalledWith(
      expect.objectContaining({ user: wallet.address })
    );
  }, 50_000);
});
