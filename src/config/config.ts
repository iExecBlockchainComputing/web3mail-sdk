export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const ANY_DATASET_ADDRESS = 'any';

// Chain IDs
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
}

export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  [CHAIN_IDS.BELLECOUR]: {
    name: 'bellecour',
    // eslint-disable-next-line sonarjs/no-duplicate-string
    dappAddress: 'web3mail.apps.iexec.eth',
    prodWorkerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
    dataProtectorSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-bellecour.iex.ec/https',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2',
  },
  [CHAIN_IDS.AVALANCHE_FUJI]: {
    name: 'avalanche',
    dappAddress: 'web3mail.apps.iexec.eth', // TODO: Update with actual Avalanche address
    prodWorkerpoolAddress: 'prod-v8-avalanche.main.pools.iexec.eth', // TODO: Update
    dataProtectorSubgraph:
      'https://thegraph.avalanche.iex.ec/subgraphs/name/avalanche/dataprotector-v2', // TODO: Update
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-avalanche.iex.ec/https', // TODO: Update
    ipfsGateway: 'https://ipfs-gateway.v8-avalanche.iex.ec', // TODO: Update
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2', // TODO: Update
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    name: 'arbitrum',
    dappAddress: 'web3mail.apps.iexec.eth', // TODO: Update with actual Arbitrum address
    prodWorkerpoolAddress: 'prod-v8-arbitrum.main.pools.iexec.eth', // TODO: Update
    dataProtectorSubgraph:
      'https://thegraph.arbitrum.iex.ec/subgraphs/name/arbitrum/dataprotector-v2', // TODO: Update
    ipfsUploadUrl: '/dns4/ipfs-upload.v8-arbitrum.iex.ec/https', // TODO: Update
    ipfsGateway: 'https://ipfs-gateway.v8-arbitrum.iex.ec', // TODO: Update
    whitelistSmartContract: '0x781482C39CcE25546583EaC4957Fb7Bf04C277D2', // TODO: Update
  },
};

export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}
