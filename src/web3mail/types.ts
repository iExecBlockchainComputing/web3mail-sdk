import { EnhancedWallet } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type Web3SignerProvider = EnhancedWallet;

export type ENS = string;

export type AddressOrENS = Address | ENS;

export type Address = string;

export type TimeStamp = string;

export type GrantedAccess = {
  dataset: string;
  datasetprice: string;
  volume: string;
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
  remainingAccess: number;
};

export type Contact = {
  address: Address;
  owner: Address;
  accessGrantTimestamp: TimeStamp;
  isUserStrict: boolean;
  name?: string;
  remainingAccess: number;
  accessPrice: number;
  grantedAccess: GrantedAccess;
};

export type SendEmailParams = {
  emailSubject: string;
  emailContent: string;
  protectedData?: Address;
  /**
   * Granted access to process.
   * use prepareBulkRequest of dataprotector to create a bulk request.
   * if not provided, the single message will be processed.
   */
  grantedAccess?: GrantedAccess[];
  /**
   * Maximum number of protected data to process per task (any protected data exceeding this number will be processed in another task)
   *
   * @default 100
   *
   * ⚠️ If you manually call prepareBulkRequest before sendEmail, the value passed here must be the same as the one passed to prepareBulkRequest.
   */
  maxProtectedDataPerTask?: number;
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
  bulkOnly?: boolean;
};

export type FetchUserContactsParams = {
  /**
   * Address of the user
   */
  userAddress: Address;
} & FetchMyContactsParams;

type SendEmailSingleResponse = {
  taskId: string;
};

type SendEmailBulkResponse = {
  tasks: {
    bulkIndex: number;
    taskId: string;
    dealId: string;
  }[];
};

export type SendEmailResponse<Params = { protectedData: Address }> =
  Params extends {
    grantedAccess: GrantedAccess[];
  }
    ? SendEmailBulkResponse
    : never & Params extends { protectedData: Address }
    ? SendEmailSingleResponse
    : never;

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
