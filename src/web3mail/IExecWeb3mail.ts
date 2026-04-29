import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExec } from 'iexec';
import { IExecDataProtectorCore } from '@iexec/dataprotector';
import { GraphQLClient } from 'graphql-request';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendEmail } from './sendEmail.js';
import { prepareEmailCampaign } from './prepareEmailCampaign.js';
import { sendEmailCampaign } from './sendEmailCampaign.js';
import {
  Contact,
  FetchUserContactsParams,
  SendEmailParams,
  Address,
  Web3MailConfigOptions,
  SendEmailResponse,
  Web3SignerProvider,
  FetchMyContactsParams,
  PrepareEmailCampaignParams,
  PrepareEmailCampaignResponse,
  SendEmailCampaignParams,
  SendEmailCampaignResponse,
} from './types.js';
import { isValidProvider } from '../utils/validators.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';
import { getChainDefaultConfig } from '../config/config.js';
import { resolveDappAddressFromCompass } from '../utils/resolveDappAddressFromCompass.js';

type EthersCompatibleProvider =
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider
  | Web3SignerProvider
  | string;

interface Web3mailResolvedConfig {
  dappAddress: Address;
  dappWhitelistAddress: Address;
  graphQLClient: GraphQLClient;
  ipfsNode: string;
  ipfsGateway: string;
  defaultWorkerpool: string;
  iexec: IExec;
  dataProtector: IExecDataProtectorCore;
}

export class IExecWeb3mail {
  private dappAddress!: Address;

  private dappWhitelistAddress!: Address;

  private graphQLClient!: GraphQLClient;

  private ipfsNode!: string;

  private ipfsGateway!: string;

  private defaultWorkerpool!: string;

  private iexec!: IExec;

  private dataProtector!: IExecDataProtectorCore;

  private initPromise: Promise<void> | null = null;

  private ethProvider: EthersCompatibleProvider;

  private options: Web3MailConfigOptions;

  constructor(
    ethProvider?: EthersCompatibleProvider,
    options?: Web3MailConfigOptions
  ) {
    this.ethProvider = ethProvider || 'arbitrum-sepolia-testnet';
    this.options = options || {};
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.resolveConfig().then((config) => {
        this.dappAddress = config.dappAddress;
        this.dappWhitelistAddress = config.dappWhitelistAddress;
        this.graphQLClient = config.graphQLClient;
        this.ipfsNode = config.ipfsNode;
        this.ipfsGateway = config.ipfsGateway;
        this.defaultWorkerpool = config.defaultWorkerpool;
        this.iexec = config.iexec;
        this.dataProtector = config.dataProtector;
      });
    }
    return this.initPromise;
  }

  async fetchMyContacts(args?: FetchMyContactsParams): Promise<Contact[]> {
    await this.init();
    await isValidProvider(this.iexec);

    return fetchMyContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddress: this.dappAddress,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async fetchUserContacts(args: FetchUserContactsParams): Promise<Contact[]> {
    await this.init();

    return fetchUserContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddress: this.dappAddress,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async sendEmail(args: SendEmailParams): Promise<SendEmailResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return sendEmail({
      ...args,
      workerpoolAddress: args.workerpoolAddress || this.defaultWorkerpool,
      iexec: this.iexec,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddress: this.dappAddress,
      dappWhitelistAddress: this.dappWhitelistAddress,
      graphQLClient: this.graphQLClient,
    });
  }

  async prepareEmailCampaign(
    args: PrepareEmailCampaignParams
  ): Promise<PrepareEmailCampaignResponse> {
    await this.init();

    return prepareEmailCampaign({
      ...args,
      workerpoolAddress: args.workerpoolAddress || this.defaultWorkerpool,
      iexec: this.iexec,
      dataProtector: this.dataProtector,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddress: this.dappAddress,
    });
  }

  async sendEmailCampaign(
    args: SendEmailCampaignParams
  ): Promise<SendEmailCampaignResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return sendEmailCampaign({
      ...args,
      workerpoolAddress: args.workerpoolAddress || this.defaultWorkerpool,
      dataProtector: this.dataProtector,
    });
  }

  private async resolveConfig(): Promise<Web3mailResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainDefaultConfig = getChainDefaultConfig(chainId, {
      allowExperimentalNetworks: this.options.allowExperimentalNetworks,
    });

    const ipfsGateway =
      this.options?.ipfsGateway || chainDefaultConfig?.ipfsGateway;

    let iexec: IExec, graphQLClient: GraphQLClient;

    try {
      iexec = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...this.options?.iexecOptions,
          allowExperimentalNetworks: this.options.allowExperimentalNetworks,
        }
      );
    } catch (e: any) {
      throw new Error(`Unsupported ethProvider: ${e.message}`);
    }

    const subgraphUrl =
      this.options?.dataProtectorSubgraph ||
      chainDefaultConfig?.dataProtectorSubgraph;
    const dappAddress =
      this.options?.dappAddress ||
      chainDefaultConfig?.dappAddress ||
      (await resolveDappAddressFromCompass(
        await iexec.config.resolveCompassURL(),
        chainId
      ));
    const dappWhitelistAddress =
      this.options?.dappWhitelistAddress ||
      chainDefaultConfig?.whitelistSmartContract;
    const defaultWorkerpool = chainDefaultConfig?.prodWorkerpoolAddress;
    const ipfsNode =
      this.options?.ipfsNode || chainDefaultConfig?.ipfsUploadUrl;

    const missing = [];
    if (!subgraphUrl) missing.push('dataProtectorSubgraph');
    if (!dappAddress) missing.push('dappAddress');
    if (!dappWhitelistAddress) missing.push('whitelistSmartContract');
    if (!ipfsGateway) missing.push('ipfsGateway');
    if (!defaultWorkerpool) missing.push('prodWorkerpoolAddress');
    if (!ipfsNode) missing.push('ipfsUploadUrl');

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for chainId ${chainId}: ${missing.join(
          ', '
        )}`
      );
    }

    try {
      graphQLClient = new GraphQLClient(subgraphUrl);
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    const dataProtector = new IExecDataProtectorCore(this.ethProvider, {
      iexecOptions: {
        ipfsGatewayURL: ipfsGateway,
        ...this.options?.iexecOptions,
        allowExperimentalNetworks: this.options.allowExperimentalNetworks,
      },
      ipfsGateway,
      ipfsNode,
      subgraphUrl,
    });

    return {
      dappAddress,
      dappWhitelistAddress: dappWhitelistAddress.toLowerCase(),
      defaultWorkerpool,
      graphQLClient,
      ipfsNode,
      ipfsGateway,
      iexec,
      dataProtector,
    };
  }
}
