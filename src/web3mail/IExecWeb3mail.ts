import { providers } from 'ethers';
import { IExec } from 'iexec';
import { Address, IExecConfigOptions } from 'iexec/IExecConfig';
import { fetchMyContacts } from './fetchMyContacts.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import { sendEmail } from './sendEmail.js';
import {
  Contact,
  FetchUserContactsParams,
  SendEmailParams,
  SendEmailResponse,
  Web3SignerProvider,
} from './types.js';
import { GraphQLClient } from 'graphql-request';
import { DATAPROTECTOR_SUBGRAPH_ENDPOINT } from '../config/config.js';

export class IExecWeb3mail {
  fetchMyContacts: () => Promise<Contact[]>;
  fetchUserContacts: (args: FetchUserContactsParams) => Promise<Contact[]>;
  sendEmail: (args: SendEmailParams) => Promise<SendEmailResponse>;

  constructor(
    ethProvider: providers.ExternalProvider | Web3SignerProvider,
    options?: {
      iexecOptions?: IExecConfigOptions;
    }
  ) {
    let iexec: IExec;
    let graphQLClient: GraphQLClient;
    try {
      iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.fetchMyContacts = () => fetchMyContacts({ iexec, graphQLClient });
    this.fetchUserContacts = (args: FetchUserContactsParams) =>
      fetchUserContacts({ ...args, iexec, graphQLClient });
    this.sendEmail = (args: SendEmailParams) =>
      sendEmail({
        ...args,
        iexec,
        graphQLClient,
      });
  }
}
