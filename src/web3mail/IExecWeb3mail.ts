import { IExec } from 'iexec';
import { fetchUserContacts } from './fetchUserContacts.js';
import { fetchMyContacts } from './fetchMyContacts.js';
import { sendEmail } from './sendEmail.js';
import {
  Contact,
  FetchUserContactsParams,
  SendEmailParams,
  AddressOrENS,
  Web3MailConfigOptions,
  SendEmailResponse,
  FetchMyContactsParams,
  EthersCompatibleProvider,
  Web3mailResolvedConfig,
} from './types.js';
import { GraphQLClient } from 'graphql-request';
import { isValidProvider } from '../utils/validators.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';
import { getChainConfig } from '../config/config.js';
import {
  createIExecInstance,
  createSubgraphClient,
  resolveConfigValues,
  validateRequiredConfig,
} from '../utils/configResolvers.js';
export class IExecWeb3mail {
  private iexec: IExec;

  private ipfsNode: string;

  private ipfsGateway: string;

  private dappAddressOrENS: AddressOrENS;

  private dappWhitelistAddress: AddressOrENS;

  private graphQLClient: GraphQLClient;

  private initPromise: Promise<void> | null = null;

  private defaultWorkerpool: AddressOrENS;

  private ethProvider: EthersCompatibleProvider;

  private options: Web3MailConfigOptions;

  constructor(
    ethProvider?: EthersCompatibleProvider,
    options?: Web3MailConfigOptions
  ) {
    this.ethProvider = ethProvider || 'bellecour';
    this.options = options || {};
  }

  protected async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.resolveConfig().then((config) => {
        this.dappWhitelistAddress = config.dappWhitelistAddress;
        this.graphQLClient = config.graphQLClient;
        this.ipfsNode = config.ipfsNode;
        this.ipfsGateway = config.ipfsGateway;
        this.defaultWorkerpool = config.defaultWorkerpool;
        this.iexec = config.iexec;
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
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async fetchUserContacts(args: FetchUserContactsParams): Promise<Contact[]> {
    await this.init();
    await isValidProvider(this.iexec);

    return fetchUserContacts({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
      dappAddressOrENS: this.dappAddressOrENS,
      dappWhitelistAddress: this.dappWhitelistAddress,
    });
  }

  async sendEmail(args: SendEmailParams): Promise<SendEmailResponse> {
    await this.init();
    await isValidProvider(this.iexec);

    return sendEmail({
      ...args,
      iexec: this.iexec,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      dappAddressOrENS: this.dappAddressOrENS,
      workerpoolAddressOrEns: this.defaultWorkerpool,
      dappWhitelistAddress: this.dappWhitelistAddress,
      graphQLClient: this.graphQLClient,
    });
  }

  private async resolveConfig(): Promise<Web3mailResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainConfig = getChainConfig(chainId, {
      allowExperimentalNetworks: this.options.allowExperimentalNetworks,
    });

    const config = resolveConfigValues(this.options, chainConfig);
    validateRequiredConfig(config, chainId);

    const [iexec, graphQLClient] = await Promise.all([
      Promise.resolve(
        createIExecInstance(this.ethProvider, config.ipfsGateway!, this.options)
      ),
      Promise.resolve(createSubgraphClient(config.dataProtectorSubgraph!)),
    ]);

    return {
      dappWhitelistAddress: config.dappWhitelistAddress!.toLowerCase(),
      dappAddressOrENS: config.dappAddressOrENS!,
      defaultWorkerpool: config.defaultWorkerpool!.toLowerCase(),
      graphQLClient,
      ipfsNode: config.ipfsNode!,
      ipfsGateway: config.ipfsGateway!,
      iexec,
    };
  }
}
