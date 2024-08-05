export declare type KnownEnv = 'prod' | 'staging' | 'bubble';
export declare type EnvKey =
  | 'chainId'
  | 'rpcURL'
  | 'hubAddress'
  | 'ensRegistryAddress'
  | 'ensPublicResolverAddress'
  | 'voucherHubAddress'
  | 'smsURL'
  | 'iexecGatewayURL'
  | 'resultProxyURL'
  | 'ipfsGatewayURL'
  | 'ipfsNodeURL'
  | 'pocoSubgraphURL'
  | 'voucherSubgraphURL'
  | 'dappAddressOrENS'
  | 'dappWhitelistAddress'
  | 'dataProtectorSubgraph'
  | 'ipfsNode'
  | 'ipfsGateway'
  | 'workerpoolProdAddress';

export declare type Environment = Record<EnvKey, string | null>;

export declare const environments: Record<KnownEnv, Environment>;

export declare const getEnvironment: (env: KnownEnv) => Environment;
