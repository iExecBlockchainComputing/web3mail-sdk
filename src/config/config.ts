export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const ANY_DATASET_ADDRESS = 'any';

export const CHAIN_IDS = {
  BELLECOUR: 134,
  AVALANCHE_FUJI: 43113,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export const DEFAULT_CHAIN_ID = CHAIN_IDS.BELLECOUR;

interface ChainConfig {
  name: string;
  dappAddress: string;
  prodWorkerpoolAddress: string;
  dataProtectorSubgraph: string;
  ipfsUploadUrl: string;
  ipfsGateway: string;
  whitelistSmartContract: string;
  isExperimental?: boolean;
}

const CHAIN_CONFIG: Record<number, ChainConfig> = {
  [CHAIN_IDS.BELLECOUR]: {
    name: 'bellecour',
    dappAddress: 'web3mail.apps.iexec.eth',
    prodWorkerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-bellecour.iex.ec/https',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2',
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    name: 'arbitrum-sepolia-testnet',
    dappAddress: 'web3mail.apps.iexec.eth',
    prodWorkerpoolAddress: '0x39c3cdd91a7f1c4ed59108a9da4e79de9a1c1b59',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsUploadUrl: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2', // TODO: add the correct address
    isExperimental: true,
  },
};

export const getChainConfig = (
  chainId: number,
  options?: { allowExperimentalNetworks?: boolean }
): ChainConfig => {
  const config = CHAIN_CONFIG[chainId];

  if (!config) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }

  if (config.isExperimental && !options?.allowExperimentalNetworks) {
    throw new Error(`Experimental network ${chainId} is not allowed. Use allowExperimentalNetworks option to enable it.`);
  }

  return config;
};
