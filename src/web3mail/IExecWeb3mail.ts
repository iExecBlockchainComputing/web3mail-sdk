import { providers } from 'ethers';
import { IExec } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
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
  private iexec: IExec;

  private graphQLClient: GraphQLClient;

  constructor(
    ethProvider: providers.ExternalProvider | Web3SignerProvider,
    options?: {
      iexecOptions?: IExecConfigOptions;
    }
  ) {
    try {
      this.iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      this.graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }
  }

  fetchMyContacts(): Promise<Contact[]> {
    return fetchMyContacts({
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  fetchUserContacts(args?: FetchUserContactsParams): Promise<Contact[]> {
    return fetchUserContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  sendEmail(args: SendEmailParams): Promise<SendEmailResponse> {
    return sendEmail({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }
}
