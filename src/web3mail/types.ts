import type { BulkRequest } from '@iexec/dataprotector';
import { EnhancedWallet } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type Web3SignerProvider = EnhancedWallet;

export type ENS = string;

export type AddressOrENS = Address | ENS;

export type Address = string;

export type TimeStamp = string;

/**
 * request to send email in bulk
 *
 * use `prepareEmailCampaign()` to create a `CampaignRequest`
 *
 * then use `sendEmailCampaign()` to send the campaign
 */
export type CampaignRequest = BulkRequest;

/**
 * authorization signed by the data owner granting access to this contact
 *
 * `GrantedAccess` are obtained by fetching contacts (e.g. `fetchMyContacts()` or `fetchUserContacts()`)
 *
 * `GrantedAccess` can be consumed for email campaigns (e.g. `prepareEmailCampaign()` then `sendEmailCampaign()`)
 */
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
  protectedData: Address;
  contentType?: string;
  senderName?: string;
  label?: string;
  workerpoolAddressOrEns?: AddressOrENS;
  dataMaxPrice?: number;
  appMaxPrice?: number;
  workerpoolMaxPrice?: number;
  useVoucher?: boolean;
  allowDeposit?: boolean;
};

export type FetchMyContactsParams = {
  /**
   * Get contacts for this specific user only
   */
  isUserStrict?: boolean;
  /**
   * If true, returns only contacts with bulk processing access grants
   */
  bulkOnly?: boolean;
};

export type FetchUserContactsParams = {
  /**
   * Address of the user
   */
  userAddress: Address;
} & FetchMyContactsParams;

export type SendEmailResponse = {
  /**
   * ID of the task
   */
  taskId: string;
  /**
   * ID of the deal containing the task
   */
  dealId: string;
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

export type PrepareEmailCampaignParams = {
  /**
   * List of `GrantedAccess` to contacts to send emails to in bulk.
   *
   * use `fetchMyContacts({ bulkOnly: true })` to get granted accesses.
   */
  grantedAccesses: GrantedAccess[];
  maxProtectedDataPerTask?: number;
  senderName?: string;
  emailSubject: string;
  emailContent: string;
  contentType?: string;
  label?: string;
  workerpoolAddressOrEns?: AddressOrENS;
  dataMaxPrice?: number;
  appMaxPrice?: number;
  workerpoolMaxPrice?: number;
};

export type PrepareEmailCampaignResponse = {
  /**
   * The prepared campaign request
   *
   * Use this in `sendEmailCampaign()` to start or continue sending the campaign
   */
  campaignRequest: CampaignRequest;
};

export type SendEmailCampaignParams = {
  /**
   * The prepared campaign request from `prepareEmailCampaign()`
   */
  campaignRequest: CampaignRequest;
  /**
   * Workerpool address or ENS to use for processing
   */
  workerpoolAddressOrEns?: AddressOrENS;
  /**
   * If true, allows automatic deposit of funds when balance is insufficient
   * @default false
   */
  allowDeposit?: boolean;
};

export type SendEmailCampaignResponse = {
  /**
   * List of tasks created for the campaign
   */
  tasks: Array<{
    /**
     * ID of the task
     */
    taskId: string;
    /**
     * ID of the deal containing the task
     */
    dealId: string;
    /**
     * Index of the task in the bulk request
     */
    bulkIndex: number;
  }>;
};
