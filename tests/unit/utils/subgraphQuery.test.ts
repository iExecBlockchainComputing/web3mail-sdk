import { describe, it, expect, jest } from '@jest/globals';
import { GraphQLClient, request } from 'graphql-request';
import { getValidContact } from '../../../dist/utils/subgraphQuery';
import { Contact, GraphQLResponse } from '../../../dist/web3Mail/types';

// Mock GraphQLClient
jest.mock('graphql-request', () => {
  // @ts-ignore
  const originalModule = jest.requireActual('graphql-request');
  return {
    // @ts-ignore
    ...originalModule,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: jest.fn<() => Promise<GraphQLResponse>>().mockResolvedValue({
        protectedDatas: [{ id: 'address1' }, { id: 'address3' }],
      }),
    })),
  };
});

const contacts: Contact[] = [
  {
    address: 'address1',
    owner: 'owner1',
    accessGrantTimestamp: '2023-06-08T09:32:29.761Z',
  },
  {
    address: 'address2',
    owner: 'owner2',
    accessGrantTimestamp: '2023-06-09T14:21:17.231Z',
  },
];

describe('getValidContact', () => {
  it.only('should fetch valid contacts', async () => {
    // Create a new instance of GraphQLClient
    const graphQLClient = new GraphQLClient('https://example.com/graphql');

    const validContacts = await getValidContact(graphQLClient, contacts);

    expect(validContacts).toEqual([
      {
        address: 'address1',
        owner: 'owner1',
        accessGrantTimestamp: '2023-06-08T09:32:29.761Z',
      },
    ]);

    expect(graphQLClient.request).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        requiredSchema: ['email:string'],
        id: ['address1', 'address2'],
        start: expect.any(Number),
        range: expect.any(Number),
      })
    );
  });

  it('should handle error when fetching protected data', async () => {
    // Change the implementation of the mock request to simulate an error
    GraphQLClient.prototype.request = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('Request failed'));

    const graphQLClient = new GraphQLClient('https://example.com/graphql');

    await expect(getValidContact(graphQLClient, contacts)).rejects.toThrow(
      'Failed to fetch subgraph'
    );
  });
});
