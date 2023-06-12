import { describe, it, expect, jest } from '@jest/globals';
import { GraphQLClient } from 'graphql-request';
import { getValidContact } from '../../../dist/utils/subgraphQuery';
import { Contact } from '../../../dist/web3Mail/types';

// Mock the GraphQLClient and the subgraph response
jest.mock('graphql-request');

// Sample test data
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
  it('should fetch valid contacts', async () => {
    const mockRequest = jest.fn().mockImplementation(async () => ({
      protectedDatas: [{ id: 'address1' }, { id: 'address3' }],
    }));

    // Mock the GraphQLClient instance
    (GraphQLClient as jest.MockedClass<any>).mockImplementation(() => ({
      request: mockRequest,
    }));

    const graphQLClient = new GraphQLClient('https://example.com/graphql');

    const validContacts = await getValidContact(graphQLClient, contacts);

    expect(validContacts).toEqual([
      {
        address: 'address1',
        owner: 'owner1',
        accessGrantTimestamp: '2023-06-08T09:32:29.761Z',
      },
    ]);
    expect(mockRequest).toHaveBeenCalledWith(
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
    const mockRequest = jest
      .fn()
      .mockRejectedValue(await Promise.reject(new Error('Request failed')));

    // Mock the GraphQLClient instance
    (GraphQLClient as jest.MockedClass<any>).mockImplementation(() => ({
      request: mockRequest,
    }));

    const graphQLClient = new GraphQLClient('https://example.com/graphql');

    await expect(getValidContact(graphQLClient, contacts)).rejects.toThrow(
      'Failed to fetch subgraph'
    );
  });
});
