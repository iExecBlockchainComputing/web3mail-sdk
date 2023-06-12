import { GraphQLClient, gql } from 'graphql-request';
import { Contact, GraphQLResponse, ProtectedDataQuery } from '../index.js';
import { WorkflowError } from './errors.js';

export const getValidContact = async (
  graphQLClient: GraphQLClient,
  contacts: Contact[]
): Promise<Contact[]> => {
  try {
    // Contacts addresses
    const contactsAddresses = contacts.map((contact) => contact.address);

    // Query protected data
    const SchemaFilteredProtectedData = gql`
      query (
        $requiredSchema: [String!]!
        $id: [String!]!
        $start: Int!
        $range: Int!
      ) {
        protectedDatas(
          where: {
            transactionHash_not: "0x"
            schema_contains: $requiredSchema
            id_in: $id
          }
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
    let protectedDataList: ProtectedDataQuery[] = [];
    let start = 0;
    const range = 1000;
    let continuePagination = true;

    do {
      const variables = {
        requiredSchema: ['email:string'],
        id: contactsAddresses,
        start,
        range,
      };

      const protectedDataResultQuery: GraphQLResponse =
        await graphQLClient.request(SchemaFilteredProtectedData, variables);

      const { protectedDatas } = protectedDataResultQuery;
      protectedDataList.push(...protectedDatas);

      continuePagination = protectedDatas.length === range;
      start += range;
    } while (continuePagination);

    // Convert protectedData [] into Contact[]
    const validContacts = protectedDataList.map(({ id }) => ({
      address: id,
      owner: contacts[id].owner,
      accessGrantTimestamp: contacts[id].accessGrantTimestamp,
    }));

    return validContacts;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch subgraph: ${error.message}`,
      error
    );
  }
};
