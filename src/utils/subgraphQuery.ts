import { GraphQLClient, gql } from 'graphql-request';
import { ProtectedData } from '../index.js';
import { WorkflowError } from './errors.js';

export const getProtectedData = async (
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
