import { GraphQLClient, gql } from 'graphql-request';
import { Contact } from '../index.js';
import { WorkflowError } from './errors.js';
import {
  GraphQLResponse,
  ProtectedDataQuery,
} from '../web3mail/internalTypes.js';

const checkProtectedDataQuery = gql`
  query GetValidContacts(
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
      name
    }
  }
`;

export const getValidContact = async (
  graphQLClient: GraphQLClient,
  contacts: Omit<Contact, 'name'>[]
): Promise<Contact[]> => {
  if (contacts.length === 0) {
    return [];
  }
  try {
    // Contacts addresses
    const contactsAddresses = contacts.map((contact) => contact.address);

    // Pagination
    const protectedDataList: ProtectedDataQuery[] = [];
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
        await graphQLClient.request(checkProtectedDataQuery, variables);

      const { protectedDatas } = protectedDataResultQuery;
      protectedDataList.push(...protectedDatas);

      continuePagination = protectedDatas.length === range;
      start += range;
    } while (continuePagination);

    // Convert contacts array into a map where the key is the contact's address
    const contactsMap = new Map(
      contacts.map((contact) => [contact.address, contact])
    );

    // Convert protectedData[] into Contact[] using the map for constant time lookups
    return protectedDataList
      .map(({ id, name }) => {
        const contact = contactsMap.get(id);
        if (contact) {
          return {
            address: id,
            name: name,
            remainingAccess: contact.remainingAccess,
            accessPrice: contact.accessPrice,
            owner: contact.owner,
            accessGrantTimestamp: contact.accessGrantTimestamp,
            isUserStrict: contact.isUserStrict,
            grantedAccess: contact.grantedAccess,
          };
        }
      })
      .filter((contact) => !!contact);
  } catch (error) {
    throw new WorkflowError({
      message: 'Failed to fetch subgraph',
      errorCause: error,
    });
  }
};

export const checkProtectedDataValidity = async (
  graphQLClient: GraphQLClient,
  protectedData: string
): Promise<boolean> => {
  try {
    const variables = {
      requiredSchema: ['email:string'],
      id: [protectedData],
      start: 0,
      range: 1,
    };

    const protectedDataResultQuery: GraphQLResponse =
      await graphQLClient.request(checkProtectedDataQuery, variables);

    const { protectedDatas } = protectedDataResultQuery;

    return protectedDatas.length === 1;
  } catch (error) {
    throw new WorkflowError({
      message: 'Failed to fetch subgraph',
      errorCause: error,
    });
  }
};
