import { EnhancedWallet, IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';

export type Web3SignerProvider = EnhancedWallet;

export type IExecConsumer = {
  iexec: IExec;
};

export type Address = string;

export type TimeStamp = string;

export type Contact = {
  address: Address;
  owner: Address;
  accessGrantTimestamp: TimeStamp;
};
export type SendEmailParams = {
  emailSubject: string;
  emailContent: string;
  protectedData: Address;
};

export type SendEmailResponse = {
  taskId: Address;
};

/**
 * Internal props for querying the subgraph
 */
export type ProtectedDataQuery = {
  id: string;
};

export type GraphQLResponse = {
  protectedDatas: ProtectedDataQuery[];
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};
