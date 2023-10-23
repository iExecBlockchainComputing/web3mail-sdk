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
  WORKERPOOL_ADDRESS,
} from '../config/config.js';

export class IExecWeb3mail {
  private iexec: IExec;
  private ipfsNode: string;
  private ipfsGateway: string;
  private dataProtectorSubgraph: string;
  private dappAddressOrEns: AddressOrENS;
  private dappWhitelistAddress: AddressOrENS;
  private workerpoolAddressOrEns: AddressOrENS;
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
      this.graphQLClient = new GraphQLClient(
        options?.dataProtectorSubgraph || DATAPROTECTOR_SUBGRAPH_ENDPOINT
      );
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.dappAddressOrEns = options?.dappAddressOrEns || WEB3_MAIL_DAPP_ADDRESS;
    this.workerpoolAddressOrEns =
      options?.workerpoolAddressOrEns || WORKERPOOL_ADDRESS;
    this.ipfsNode = options?.ipfsNode || IPFS_UPLOAD_URL;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;
    this.dappWhitelistAddress =
      options?.dappWhitelistAddress || WHITELIST_SMART_CONTRACT_ADDRESS;

    this.fetchMyContacts = (args?: FetchContactsParams) =>
      fetchMyContacts({
        ...args,
        iexec: this.iexec,
        graphQLClient: this.graphQLClient,
        dappAddressOrEns: this.dappAddressOrEns,
        dappWhitelistAddress: this.dappWhitelistAddress,
      });
    this.sendEmail = (args: SendEmailParams) =>
      sendEmail({
        ...args,
        iexec: this.iexec,
        ipfsNode: this.ipfsNode,
        ipfsGateway: this.ipfsGateway,
        graphQLClient: this.graphQLClient,
        dappAddressOrENS: this.dappAddressOrEns,
        workerpoolAddressOrEns: this.workerpoolAddressOrEns,
      });
  }

  fetchMyContacts: (args?: FetchContactsParams) => Promise<Contact[]>;
  sendEmail: (args: SendEmailParams) => Promise<SendEmailResponse>;
}
