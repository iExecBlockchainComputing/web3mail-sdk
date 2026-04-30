export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const ANY_DATASET_ADDRESS = 'any';
export const CALLBACK_WEB3MAIL = '0x5f936db7ad6d29371808e42a87015595d90509ba';

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
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0x2956f0cb779904795a5f30d3b3ea88b714c3123f', // TDX workerpool
    dataProtectorSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    whitelistSmartContract: '0x8d46d40840f1Aa2264F96184Ffadf04e5D573B9B',
  },
  42161: {
    name: 'arbitrum-mainnet',
    dappAddress: undefined, // ENS not supported on this network, address will be resolved from Compass
    prodWorkerpoolAddress: '0x8ef2ec3ef9535d4b4349bfec7d8b31a580e60244', // TDX workerpool
    dataProtectorSubgraph:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/Ep5zs5zVr4tDiVuQJepUu51e5eWYJpka624X4DMBxe3u',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    whitelistSmartContract: '0xD5054a18565c4a9E5c1aa3cEB53258bd59d4c78C',
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

/**
 * When `ethProvider` is a string, it may be an RPC URL, a decimal chain id, or an
 * iExec chain host name (see each chain's `name` in CHAIN_CONFIG). RPC URLs are not
 * resolved here (returns undefined); JsonRpcProvider handles those.
 */
export function tryResolveChainIdFromProviderString(
  hint: string
): number | undefined {
  const trimmed = hint.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const lower = trimmed.toLowerCase();
  for (const [id, cfg] of Object.entries(CHAIN_CONFIG)) {
    if (cfg.name.toLowerCase() === lower) {
      return Number(id);
    }
  }
  return undefined;
}
