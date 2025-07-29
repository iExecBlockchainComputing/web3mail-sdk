export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const ANY_DATASET_ADDRESS = 'any';
export const CALLBACK_WEB3MAIL = '0x5f936db7ad6d29371808e42a87015595d90509ba';

export const DEFAULT_CHAIN_ID = 134;

interface ChainConfig {
  name: string;
  dappAddress?: string;
  prodWorkerpoolAddress: string;
  dataProtectorSubgraph: string;
  ipfsUploadUrl: string;
  ipfsGateway: string;
  whitelistSmartContract: string;
  isExperimental?: boolean;
}

const CHAIN_CONFIG: Record<number, ChainConfig> = {
  134: {
    name: 'bellecour',
    dappAddress: 'web3mail.apps.iexec.eth',
    prodWorkerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-bellecour.iex.ec/https',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2',
  },
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
    dataProtectorSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    whitelistSmartContract: '0x8d46d40840f1Aa2264F96184Ffadf04e5D573B9B',
    isExperimental: true,
  },
};

export const getChainDefaultConfig = (
  chainId: number,
  options?: { allowExperimentalNetworks?: boolean }
): ChainConfig | null => {
  const config = CHAIN_CONFIG[chainId];

  if (!config) {
    return null;
  }

  if (config.isExperimental && !options?.allowExperimentalNetworks) {
    return null;
  }

  return config;
};
