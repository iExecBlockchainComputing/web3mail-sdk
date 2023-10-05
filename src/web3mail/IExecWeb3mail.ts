import { providers } from 'ethers';
import { IExec } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendEmail } from './sendEmail.js';
import {
  Contact,
  FetchContactsParams,
  SendEmailParams,
  SendEmailResponse,
  Web3SignerProvider,
} from './types.js';
import { GraphQLClient } from 'graphql-request';
import { DATAPROTECTOR_SUBGRAPH_ENDPOINT } from '../config/config.js';

export class IExecWeb3mail {
  fetchMyContacts: (args?: FetchContactsParams) => Promise<Contact[]>;
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

    this.fetchMyContacts = (args?: FetchContactsParams) =>
      fetchMyContacts({ ...args, iexec, graphQLClient });
    this.sendEmail = (args: SendEmailParams) =>
      sendEmail({
        ...args,
        iexec,
        graphQLClient,
      });
  }
}
