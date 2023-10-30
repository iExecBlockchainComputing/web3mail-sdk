import { providers } from 'ethers';
import { IExec } from 'iexec';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendEmail } from './sendEmail.js';
import {
  Contact,
  SendEmailParams,
  SendEmailResponse,
  Web3SignerProvider,
  AddressOrENS,
  Web3MailConfigOptions,
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
  fetchMyContacts: () => Promise<Contact[]>;

  sendEmail: (args: SendEmailParams) => Promise<SendEmailResponse>;

  private iexec: IExec;

  private ipfsNode: string;

  private ipfsGateway: string;

  private dataProtectorSubgraph: string;

  private dappAddressOrENS: AddressOrENS;

  private dappWhitelistAddress: AddressOrENS;

  private graphQLClient: GraphQLClient;

  constructor(
    ethProvider: providers.ExternalProvider | Web3SignerProvider,
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

    this.fetchMyContacts = () =>
      fetchMyContacts({
        iexec: this.iexec,
        graphQLClient: this.graphQLClient,
        dappAddressOrENS: this.dappAddressOrENS,
        dappWhitelistAddress: this.dappWhitelistAddress,
      });

    this.sendEmail = (args: SendEmailParams) =>
      sendEmail({
        ...args,
        iexec: this.iexec,
        ipfsNode: this.ipfsNode,
        ipfsGateway: this.ipfsGateway,
        dappAddressOrENS: this.dappAddressOrENS,
        graphQLClient: this.graphQLClient,
      });
  }
}
