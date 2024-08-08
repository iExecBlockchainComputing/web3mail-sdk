import { KnownEnv, getEnvironment } from '@iexec/web3mail-environments';
import 'dotenv/config';

const { ENV } = process.env;

const {
  chainId,
  rpcURL,
  hubAddress,
  ensRegistryAddress,
  ensPublicResolverAddress,
  voucherHubAddress,
  smsURL,
  iexecGatewayURL,
  resultProxyURL,
  ipfsGatewayURL,
  ipfsNodeURL,
  pocoSubgraphURL,
  voucherSubgraphURL,
  dappAddressOrENS,
  dappWhitelistAddress,
  dataprotectorContractAddress,
  dataProtectorSubgraph,
  workerpoolProdAddress,
} = getEnvironment(ENV as KnownEnv);

export const iexecOptions = {
  chainId,
  rpcURL,
  hubAddress,
  ensRegistryAddress,
  ensPublicResolverAddress,
  voucherHubAddress,
  smsURL,
  iexecGatewayURL,
  resultProxyURL,
  ipfsGatewayURL,
  ipfsNodeURL,
  pocoSubgraphURL,
  voucherSubgraphURL,
};

export const web3mailOptions = {
  dappAddressOrENS,
  dappWhitelistAddress,
  dataProtectorSubgraph,
  ipfsNode: ipfsNodeURL,
  ipfsGateway: ipfsGatewayURL,
};
export const dataProtectorOptions = {
  contractAddress: dataprotectorContractAddress,
  subgraphUrl: dataProtectorSubgraph,
  ipfsNode: ipfsNodeURL,
  ipfsGateway: ipfsGatewayURL,
};
export const WEB3_MAIL_DAPP_ADDRESS = dappAddressOrENS;

export const PROD_WORKERPOOL_ADDRESS = workerpoolProdAddress;

export const DATAPROTECTOR_SUBGRAPH_ENDPOINT = dataProtectorSubgraph;

export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const DEFAULT_CONTENT_TYPE = 'text/plain';
export const IPFS_UPLOAD_URL = ipfsNodeURL;

export const DEFAULT_IPFS_GATEWAY = ipfsGatewayURL;

export const WHITELIST_SMART_CONTRACT_ADDRESS = dappWhitelistAddress;

export const ANY_DATASET_ADDRESS = 'any';
