import { GraphQLClient, gql } from 'graphql-request';
import { WEB3_MAIL_DAPP_ADDRESS } from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { throwIfMissing } from '../utils/validators.js';
import {
  Contact,
  IExecConsumer,
  ProtectedData,
  SubgraphConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
}: IExecConsumer & SubgraphConsumer): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    const showDatasetOrderbookRequest = iexec.orderbook.fetchDatasetOrderbook(
      'any',
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
        requester: userAddress,
      }
    );
    const { orders } = await autoPaginateRequest({
      request: showDatasetOrderbookRequest,
    });
    let myContacts: Contact[] = [];
    const web3DappResolvedAddress = await iexec.ens.resolveName(
      WEB3_MAIL_DAPP_ADDRESS
    );

    orders.forEach((order) => {
      if (
        order.order.apprestrict.toLowerCase() ===
        web3DappResolvedAddress.toLowerCase()
      ) {
        const contact = {
          address: order.order.dataset.toLowerCase(),
          owner: order.signer.toLowerCase(),
          accessGrantTimestamp: order.publicationTimestamp,
        };
        myContacts.push(contact);
      }
    });

    const protectedDataResultQuery = await getProtectedData(graphQLClient);

    // Convert protectedDatas into a Set
    const protectedDataIds = new Set(
      protectedDataResultQuery.map((data) => data.id)
    );

    // Filter myContacts list with protected data
    myContacts = myContacts.filter((contact) => {
      return protectedDataIds.has(contact.address);
    });

    return myContacts;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};

const getProtectedData = async (
  graphQLClient: GraphQLClient
): Promise<ProtectedData[]> => {
  try {
    const schemaArray = ['email:string'];
    const SchemaFilteredProtectedData = gql`
      query ($requiredSchema: [String!]!, $start: Int!, $range: Int!) {
        protectedDatas(
          where: { transactionHash_not: "0x", schema_contains: $requiredSchema }
          skip: $start
          first: $range
          orderBy: creationTimestamp
          orderDirection: desc
        ) {
          id
        }
      }
    `;

    // Pagination
    let allProtectedDataArray: ProtectedData[] = [];
    let start = 0;
    const range = 1000;
    let continuePagination = true;

    while (continuePagination) {
      const variables = {
        requiredSchema: schemaArray,
        start: start,
        range: range,
      };

      let protectedDataResultQuery: ProtectedData[] =
        await graphQLClient.request(SchemaFilteredProtectedData, variables);

      allProtectedDataArray = [
        ...allProtectedDataArray,
        ...protectedDataResultQuery,
      ];

      if (protectedDataResultQuery.length < range) {
        continuePagination = false;
      } else {
        start += range;
      }
    }
    return allProtectedDataArray;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch protected data: ${error.message}`,
      error
    );
  }
};
