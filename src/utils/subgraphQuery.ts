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
const getProtectedDataQuery = (requiredSchema: string[], id: string[], start: number, range: number) => {
  return gql`
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
      }
    }
  `;
};

export const getValidContact = async (
  graphQLClient: GraphQLClient,
  contacts: Contact[]
): Promise<Contact[]> => {
  try {
    // Contacts addresses
    const contactsAddresses = contacts.map((contact) => contact.address);

    // Pagination
    let protectedDataList: ProtectedDataQuery[] = [];
    let start = 0;
    const range = 1000;
    let continuePagination = true;

    do {
      const protectedDataQuery = getProtectedDataQuery(['email:string'], contactsAddresses, start, range);

      const variables = {
        requiredSchema: ['email:string'],
        id: contactsAddresses,
        start,
        range,
      };

      const protectedDataResultQuery: GraphQLResponse = await graphQLClient.request(
        protectedDataQuery,
        variables
      );

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

    // Convert contacts array into a map where the key is the contact's address
    const contactsMap = new Map(
      contacts.map((contact) => [contact.address, contact])
    );

    // Convert protectedData[] into Contact[] using the map for constant time lookups
    const validContacts = protectedDataList.map(({ id }) => {
      const contact = contactsMap.get(id);
      if (contact) {
        return {
          address: id,
          owner: contact.owner,
          accessGrantTimestamp: contact.accessGrantTimestamp,
        };
      }
    });

    return validContacts;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch subgraph: ${error.message}`,
      error
    );
  }
};

export const checkProtectedDataValidity = async (
  graphQLClient: GraphQLClient,
  protectedData: string
): Promise<boolean> => {
  try {
const getQuery = (requiredSchema: string[], id: string) => {
  return gql`
    query CheckProtectedDataValidity($requiredSchema: [String!]!, $id: String!) {
      protectedDatas(
        where: {
          transactionHash_not: "0x",
          schema_contains: $requiredSchema,
          id: $id
        }
      ) {
        id
      }
    }
  `;
};

const createVariables = (protectedData: string) => {
  return {
    requiredSchema: ['email:string'],
    id: protectedData,
  };
};
export const checkProtectedDataValidity = async (
  graphQLClient: GraphQLClient,
  protectedData: string
): Promise<boolean> => {
  try {
    const query = getQuery(['email:string'], protectedData);
    const variables = createVariables(protectedData);

    const result: GraphQLResponse = await graphQLClient.request(query, variables);

    const { protectedDatas } = protectedDataResultQuery;

    return protectedDatas.length === 1;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch subgraph: ${error.message}`,
      error
    );
  }
}