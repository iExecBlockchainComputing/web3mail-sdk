export declare type KnownEnv = 'bellecour' | 'prod' | 'staging' | 'bubble';
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
  | 'workerpool';

export declare type Environment = Record<EnvKey, string | null>;

export declare const environments: Record<KnownEnv, Environment>;

export declare const getEnvironment: (env: KnownEnv) => Environment;
