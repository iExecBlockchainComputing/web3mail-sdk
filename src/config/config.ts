// eslint-disable-next-line import/no-extraneous-dependencies
import { getEnvironment, KnownEnv } from '@iexec/web3mail-environments';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'dotenv/config';

const { ENV = 'bellecour-fork' } = process.env;

const {
  dappAddressOrENS,
  dappWhitelistAddress,
  dataProtectorSubgraph,
  ipfsNode,
  ipfsGateway,
  workerpool,
} = getEnvironment(ENV as KnownEnv);

export const WEB3_MAIL_DAPP_ADDRESS = dappAddressOrENS;
export const PROD_WORKERPOOL_ADDRESS = workerpool;
export const DATAPROTECTOR_SUBGRAPH_ENDPOINT = dataProtectorSubgraph;
export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const IPFS_UPLOAD_URL = ipfsNode;
export const DEFAULT_IPFS_GATEWAY = ipfsGateway;
export const WHITELIST_SMART_CONTRACT_ADDRESS = dappWhitelistAddress;
export const ANY_DATASET_ADDRESS = 'any';
