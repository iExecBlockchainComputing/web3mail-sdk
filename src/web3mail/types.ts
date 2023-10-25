import { GraphQLClient } from 'graphql-request';
import { EnhancedWallet, IExec } from 'iexec';

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
  contentType?: string;
  senderName?: string;
};

export type FetchContactsParams = {
  /**
   * Index of the page to fetch, starts at 1
   */
  page?: number;
  /**
   * Size of the page to fetch, greater than or equal to 10
   */
  pageSize?: number;
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
