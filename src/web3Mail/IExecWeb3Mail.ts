import { IExec } from 'iexec';
import { fetchMyContacts } from './fetchMyContacts.js';
import { Contact, SendEmailParams, SendEmailResponse } from './types.js';
import sendEmail from './sendEmail.js';

export class IExecWeb3Mail {
  fetchMyContacts: () => Promise<Contact[]>;
  sendEmail: (args: SendEmailParams) => Promise<SendEmailResponse>;

  constructor(
    ethProvider: any,
    { providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: IExec;
    try {
      iexec = new IExec(
        { ethProvider },
        { confirms: 3, providerOptions, ...iexecOptions }
      );
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }
    this.fetchMyContacts = () => fetchMyContacts({ iexec });
    this.sendEmail = (args: SendEmailParams) =>
      sendEmail({
        ...args,
        iexec,
      });
  }
}
