import { GraphQLClient } from 'graphql-request';
import { EnhancedWallet, IExec } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type Web3SignerProvider = EnhancedWallet;

export type IExecConsumer = {
  iexec: IExec;
};

export type ENS = string;

export type AddressOrENS = Address | ENS;

export type Address = string;

export type TimeStamp = string;

export type Contact = {
  address: Address;
  owner: Address;
  accessGrantTimestamp: TimeStamp;
  isUserStrict: boolean;
  name: string;
  remainingAccess: number;
  accessPrice: number;
};

export type SendEmailParams = {
  emailSubject: string;
  emailContent: string;
  protectedData: Address;
  contentType?: string;
  senderName?: string;
  label?: string;
  workerpoolAddressOrEns?: AddressOrENS;
  dataMaxPrice?: number;
  appMaxPrice?: number;
  workerpoolMaxPrice?: number;
  useVoucher?: boolean;
};

export type FetchMyContactsParams = {
  /**
   * Get contacts for this specific user only
   */
  isUserStrict?: boolean;
};

export type FetchUserContactsParams = {
  /**
   * Address of the user
   */
  userAddress: Address;
} & FetchMyContactsParams;

export type SendEmailResponse = {
  taskId: string;
};

/**
 * Internal props for querying the subgraph
 */
export type ProtectedDataQuery = {
  id: string;
  name: string;
};

export type GraphQLResponse = {
  protectedDatas: ProtectedDataQuery[];
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};

/**
 * Configuration options for Web3Mail.
 */
export type Web3MailConfigOptions = {
  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for the email sender dapp.
   * If not provided, the default web3mail address will be used.
   */
  dappAddressOrENS?: AddressOrENS;

  /**
   * The Ethereum contract address for the whitelist.
   * If not provided, the default whitelist smart contract address will be used.
   */
  dappWhitelistAddress?: Address;

  /**
   * The subgraph URL for querying data.
   * If not provided, the default data protector subgraph URL will be used.
   */
  dataProtectorSubgraph?: string;

  /**
   * Options specific to iExec integration.
   * If not provided, default iexec options will be used.
   */
  iexecOptions?: IExecConfigOptions;

  /**
   * The IPFS node URL.
   * If not provided, the default IPFS node URL will be used.
   */
  ipfsNode?: string;

  /**
   * The IPFS gateway URL.
   * If not provided, the default IPFS gateway URL will be used.
   */
  ipfsGateway?: string;

  /**
   * if true allows using a provider connected to an experimental networks (default false)
   *
   * ⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.
   */
  allowExperimentalNetworks?: boolean;
};

export type DappAddressConsumer = {
  dappAddressOrENS: AddressOrENS;
};

export type IpfsNodeConfigConsumer = {
  ipfsNode: string;
};

export type IpfsGatewayConfigConsumer = {
  ipfsGateway: string;
};

export type DappWhitelistAddressConsumer = {
  dappWhitelistAddress: string;
};
