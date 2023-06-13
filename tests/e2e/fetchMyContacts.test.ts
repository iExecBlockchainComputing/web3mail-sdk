import {
  GrantedAccess,
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../dist/config/config';
import { IExecWeb3mail, getWeb3Provider } from '../../dist/index';
import { WorkflowError } from '../../dist/utils/errors';
import { IExec } from 'iexec';

describe('web3mail.fetchMyContacts()', () => {
  let wallet: Wallet;
  let web3mail: IExecWeb3mail;
  let dataProtector: IExecDataProtector;
  let protectedDataForASpecificRequester: ProtectedDataWithSecretProps;
  let protectedDataForAnyRequester: ProtectedDataWithSecretProps;
  let grantedAccessForASpecificRequester: GrantedAccess;
  let grantedAccessForAnyRequester: GrantedAccess;
  let ethProvider: any;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    ethProvider = getWeb3Provider(wallet.privateKey);
    dataProtector = new IExecDataProtector(ethProvider);
    web3mail = new IExecWeb3mail(ethProvider);
  }, 30_000);

  it('pass with a granted access for a specific requester', async () => {
    protectedDataForASpecificRequester = await dataProtector.protectData({
      data: { email: 'test@gmail.com' },
      name: 'test do not use',
    });

    grantedAccessForASpecificRequester = await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: protectedDataForASpecificRequester.address,
      authorizedUser: wallet.address,
    });

    const res = await web3mail.fetchMyContacts();
    const foundContactForASpecificRequester = res.find((obj) => {
      return (
        obj['address'] ===
        protectedDataForASpecificRequester.address.toLocaleLowerCase()
      );
    });
    expect(
      foundContactForASpecificRequester &&
        foundContactForASpecificRequester['address']
    ).toBeDefined();
    expect(
      foundContactForASpecificRequester &&
        foundContactForASpecificRequester['address']
    ).toBe(protectedDataForASpecificRequester.address.toLocaleLowerCase());
  }, 40_000);

  it('pass with a granted access for any requester', async () => {
    protectedDataForAnyRequester = await dataProtector.protectData({
      data: { email: 'test@gmail.com' },
      name: 'test do not use',
    });
    grantedAccessForAnyRequester = await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: protectedDataForAnyRequester.address,
      authorizedUser: NULL_ADDRESS,
    });

    const res = await web3mail.fetchMyContacts();

    const foundContactForAnyRequester = res.find(
      (obj) =>
        obj['address'] === protectedDataForAnyRequester.address.toLowerCase()
    );
    expect(
      foundContactForAnyRequester && foundContactForAnyRequester['address']
    ).toBeDefined();
    expect(
      foundContactForAnyRequester && foundContactForAnyRequester['address']
    ).toBe(protectedDataForAnyRequester.address.toLocaleLowerCase());

    //revoke access to not appear as contact for anyone
    const revoke = await dataProtector.revokeOneAccess(
      grantedAccessForAnyRequester
    );
    expect(revoke).toBeDefined();
  }, 40_000);

  it('should return no contact', async () => {
    const mockedWeb3mail = new IExecWeb3mail(
      getWeb3Provider(wallet.privateKey)
    );
    jest.spyOn(mockedWeb3mail, 'fetchMyContacts').mockResolvedValue([]);

    const contacts = await mockedWeb3mail.fetchMyContacts();

    expect(contacts).toEqual([]);
  });

  it('should throw a WorkflowError with a specific message', async () => {
    const mockedWeb3mail = new IExecWeb3mail(
      getWeb3Provider(wallet.privateKey)
    );
    jest
      .spyOn(mockedWeb3mail, 'fetchMyContacts')
      .mockRejectedValue(
        new WorkflowError(
          'Failed to fetch my contacts: wrong address is not a valid ethereum address',
          new Error()
        )
      );

    const expectedErrorMessage =
      'Failed to fetch my contacts: wrong address is not a valid ethereum address';

    await expect(mockedWeb3mail.fetchMyContacts()).rejects.toThrowError(
      WorkflowError
    );
    await expect(mockedWeb3mail.fetchMyContacts()).rejects.toThrowError(
      expectedErrorMessage
    );
  });

  it('Should not return dataset as a contact', async () => {
    const iexec = new IExec({
      ethProvider,
    });
    const dataset = await iexec.dataset.deployDataset({
      owner: wallet.address,
      name: 'test do not use',
      multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
      checksum:
        '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
    });
    const encryptionKey = await iexec.dataset.generateEncryptionKey();

    await iexec.dataset.pushDatasetSecret(dataset.address, encryptionKey);

    await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: dataset.address,
      authorizedUser: wallet.address,
    });
    const myContacts = await web3mail.fetchMyContacts();
    expect(myContacts.map(({ address }) => address)).not.toContain(
      dataset.address
    );
  }, 40_000);

  it('should return only contacts that have a valid email', async () => {
    const protectedData = await dataProtector.protectData({
      data: { notemail: 'not email' },
      name: 'test do not use',
    });
    const grantedAccess = await dataProtector.grantAccess({
      authorizedApp: WEB3_MAIL_DAPP_ADDRESS,
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });

    const res = await web3mail.fetchMyContacts();

    expect(
      res.filter((contact) => contact.address === protectedData.address)
    ).toStrictEqual([]);
  }, 40_000);
});
