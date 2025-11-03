import { IExec } from 'iexec';
import { AddressOrENS } from './types.js';
import { GraphQLClient } from 'graphql-request';
import { IExecDataProtectorCore } from '@iexec/dataprotector';

export type ProtectedDataQuery = {
  id: string;
  name: string;
};

export type GraphQLResponse = {
  protectedDatas: ProtectedDataQuery[];
};

export type DappAddressConsumer = {
  dappAddressOrENS: AddressOrENS;
};

export type IpfsNodeConfigConsumer = {
  ipfsNode: string;
};

export type IpfsGatewayConfigConsumer = {
  ipfsGateway: string;
};

export type DappWhitelistAddressConsumer = {
  dappWhitelistAddress: string;
};

export type IExecConsumer = {
  iexec: IExec;
};

export type DataProtectorConsumer = { dataProtector: IExecDataProtectorCore };

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};
