export type ChainId = number;

export interface ChainConfig {
  name: string;
  dappWhitelistAddress: string;
  dappAddressOrENS: string;
  dataProtectorSubgraph: string;
  ipfsGateway: string;
  ipfsNode: string;
  defaultWorkerpool: string;
  isExperimental?: boolean;
}

export const DEFAULT_CHAIN_ID = 134;
export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const ANY_DATASET_ADDRESS = 'any';

export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  // Bellecour
  134: {
    name: 'bellecour',
    dappAddressOrENS: 'web3mail.apps.iexec.eth',
    dappWhitelistAddress: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    defaultWorkerpool: '0x39c3cdd91a7f1c4ed59108a9da4e79de9a1c1b59', // prod-v8-bellecour.main.pools.iexec.eth
    isExperimental: false,
  },
  // Arbitrum Sepolia
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dappAddressOrENS: 'web3mail.apps.iexec.eth',
    dappWhitelistAddress: '', //TODO Replace with deployed dapp whitelist address on Arbitrum Sepolia
    dataProtectorSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    defaultWorkerpool: '', // TODO  Replace with deployed workerpool address on Arbitrum Sepolia
    isExperimental: true,
  },
};

export const getChainConfig = (
  chainId: ChainId,
  options?: { allowExperimentalNetworks?: boolean }
): ChainConfig => {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Chain config not found for chainId: ${chainId}`);
  }
  if (config.isExperimental && !options?.allowExperimentalNetworks) {
    throw new Error(`Experimental network not allowed for chainId: ${chainId}`);
  }
  return config;
};
