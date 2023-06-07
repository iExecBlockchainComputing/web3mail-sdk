import {
  GrantedAccess,
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '@iexec/dataprotector';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { WEB3_MAIL_DAPP_ADDRESS } from '../../dist/config/config';
import { IExecWeb3Mail, getWeb3Provider } from '../../dist/index';
import { WorkflowError } from '../../dist/utils/errors';
describe('web3mail.fetchMyContacts()', () => {
  let wallet: Wallet;
  let web3mail: IExecWeb3Mail;
  let dataProtector: IExecDataProtector;
  let protectedDataForASpecificRequester: ProtectedDataWithSecretProps;
  let protectedDataForAnyRequester: ProtectedDataWithSecretProps;
  let grantedAccessForASpecificRequester: GrantedAccess;
  let grantedAccessForAnyRequester: GrantedAccess;
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    web3mail = new IExecWeb3Mail(getWeb3Provider(wallet.privateKey));
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
      return obj['address'] === protectedDataForASpecificRequester.address;
    });
    expect(
      foundContactForASpecificRequester &&
        foundContactForASpecificRequester['address']
    ).toBeDefined();
    expect(
      foundContactForASpecificRequester &&
        foundContactForASpecificRequester['address']
    ).toBe(protectedDataForASpecificRequester.address);
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
      (obj) => obj['address'] === protectedDataForAnyRequester.address
    );
    expect(
      foundContactForAnyRequester && foundContactForAnyRequester['address']
    ).toBeDefined();
    expect(
      foundContactForAnyRequester && foundContactForAnyRequester['address']
    ).toBe(protectedDataForAnyRequester.address);
  }, 40_000);

  it('should return no contact', async () => {
    const mockedWeb3Mail = new IExecWeb3Mail(
      getWeb3Provider(wallet.privateKey)
    );
    jest.spyOn(mockedWeb3Mail, 'fetchMyContacts').mockResolvedValue([]);

    const contacts = await mockedWeb3Mail.fetchMyContacts();

    expect(contacts).toEqual([]);
  });

  it('should throw a WorkflowError with a specific message', async () => {
    const mockedWeb3Mail = new IExecWeb3Mail(
      getWeb3Provider(wallet.privateKey)
    );
    jest
      .spyOn(mockedWeb3Mail, 'fetchMyContacts')
      .mockRejectedValue(
        new WorkflowError(
          'Failed to fetch my contacts: wrong address is not a valid ethereum address',
          new Error()
        )
      );

    const expectedErrorMessage =
      'Failed to fetch my contacts: wrong address is not a valid ethereum address';

    await expect(mockedWeb3Mail.fetchMyContacts()).rejects.toThrowError(
      WorkflowError
    );
    await expect(mockedWeb3Mail.fetchMyContacts()).rejects.toThrowError(
      expectedErrorMessage
    );
  });
});
