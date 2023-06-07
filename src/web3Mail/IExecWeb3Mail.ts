import { IExec } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';
import { fetchMyContacts } from './fetchMyContacts.js';
import sendEmail from './sendEmail.js';
import {
  Contact,
  ExternalProvider,
  SendEmailParams,
  SendEmailResponse,
  Web3SignerProvider,
} from './types.js';

export class IExecWeb3Mail {
  fetchMyContacts: () => Promise<Contact[]>;
  sendEmail: (args: SendEmailParams) => Promise<SendEmailResponse>;

  constructor(
    ethProvider: ExternalProvider | Web3SignerProvider,
    options?: {
      iexecOptions?: IExecConfigOptions;
    }
  ) {
    let iexec: IExec;
    try {
      iexec = new IExec({ ethProvider }, options?.iexecOptions);
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
