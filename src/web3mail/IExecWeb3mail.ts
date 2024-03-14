import { Eip1193Provider } from 'ethers';
import { IExec } from 'iexec';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendEmail } from './sendEmail.js';
import {
  Contact,
  FetchUserContactsParams,
  SendEmailParams,
  Web3SignerProvider,
  AddressOrENS,
  Web3MailConfigOptions,
  SendEmailResponse,
} from './types.js';
import { GraphQLClient } from 'graphql-request';
import {
  WEB3_MAIL_DAPP_ADDRESS,
  IPFS_UPLOAD_URL,
  DEFAULT_IPFS_GATEWAY,
  DATAPROTECTOR_SUBGRAPH_ENDPOINT,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../config/config.js';

export class IExecWeb3mail {
  private iexec: IExec;

  private ipfsNode: string;

  private ipfsGateway: string;

  private dataProtectorSubgraph: string;

  private dappAddressOrENS: AddressOrENS;

  private dappWhitelistAddress: AddressOrENS;

  private graphQLClient: GraphQLClient;

  constructor(
    ethProvider: Eip1193Provider | Web3SignerProvider,
    options?: Web3MailConfigOptions
  ) {
    try {
      this.iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      this.dataProtectorSubgraph =
        options?.dataProtectorSubgraph || DATAPROTECTOR_SUBGRAPH_ENDPOINT;
      this.graphQLClient = new GraphQLClient(this.dataProtectorSubgraph);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.dappAddressOrENS = options?.dappAddressOrENS || WEB3_MAIL_DAPP_ADDRESS;
    this.ipfsNode = options?.ipfsNode || IPFS_UPLOAD_URL;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;
    this.dappWhitelistAddress =
      options?.dappWhitelistAddress || WHITELIST_SMART_CONTRACT_ADDRESS;
  }

  fetchMyContacts = (): Promise<Contact[]> =>
    fetchMyContacts({
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });

  fetchUserContacts(args?: FetchUserContactsParams): Promise<Contact[]> {
    return fetchUserContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  sendEmail = (args: SendEmailParams): Promise<SendEmailResponse> =>
    sendEmail({
      ...args,
      iexec: this.iexec,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
      graphQLClient: this.graphQLClient,
    });
}
