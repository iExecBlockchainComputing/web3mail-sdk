import { describe, it, expect, jest } from '@jest/globals';
import { GraphQLClient } from 'graphql-request';
import {
  getValidContact,
  checkProtectedDataValidity,
} from '../../../src/utils/subgraphQuery.js';
import type { Contact } from '../../../src/web3mail/types.js';

describe('getValidContact', () => {
  // Define the variables in the outermost scope
  let contacts: Omit<Contact, 'name'>[];
  let graphQLClient: GraphQLClient;

  beforeAll(() => {
    // Initialize the variables in the beforeAll hook
    const mockGrantedAccess = {
      dataset: 'address1',
      datasetprice: '0',
      volume: '1',
      tag: 'tee,scone',
      apprestrict: 'app1',
      workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: 'salt',
      sign: 'sign',
      remainingAccess: 1,
    };
    contacts = [
      {
        address: 'address1',
        owner: 'owner1',
        accessGrantTimestamp: '2023-06-08T09:32:29.761Z',
        remainingAccess: 1,
        accessPrice: 0,
        isUserStrict: true,
        grantedAccess: mockGrantedAccess,
      },
      {
        address: 'address2',
        owner: 'owner2',
        accessGrantTimestamp: '2023-06-09T14:21:17.231Z',
        remainingAccess: 1,
        accessPrice: 0,
        isUserStrict: true,
        grantedAccess: { ...mockGrantedAccess, dataset: 'address2' },
      },
      {
        address: 'address3',
        owner: 'owner3',
        accessGrantTimestamp: '2023-06-10T14:21:17.231Z',
        remainingAccess: 1,
        accessPrice: 0,
        isUserStrict: true,
        grantedAccess: { ...mockGrantedAccess, dataset: 'address3' },
      },
    ];

    // Create a new instance of GraphQLClient
    graphQLClient = new GraphQLClient('');
  });

  it('should fetch valid contacts', async () => {
    // Mock the request method of the GraphQLClient instance
    jest.spyOn(graphQLClient, 'request').mockResolvedValue({
      protectedDatas: [
        { id: 'address1', name: 'Contact 1' },
        { id: 'address3', name: 'Contact 3' },
      ],
    });

    const validContacts = await getValidContact(graphQLClient, contacts);

    expect(validContacts).toEqual([
      {
        address: 'address1',
        owner: 'owner1',
        accessGrantTimestamp: '2023-06-08T09:32:29.761Z',
        name: 'Contact 1',
        remainingAccess: 1,
        accessPrice: 0,
        isUserStrict: true,
        grantedAccess: contacts[0].grantedAccess,
      },
      {
        address: 'address3',
        owner: 'owner3',
        accessGrantTimestamp: '2023-06-10T14:21:17.231Z',
        name: 'Contact 3',
        remainingAccess: 1,
        accessPrice: 0,
        isUserStrict: true,
        grantedAccess: contacts[2].grantedAccess,
      },
    ]);

    expect(graphQLClient.request).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        requiredSchema: ['email:string'],
        id: ['address1', 'address2', 'address3'],
        start: expect.any(Number),
        range: 1000,
      })
    );
  });

  it('should handle error when fetching protected data', async () => {
    // Change the implementation of the mock request to simulate an error
    jest
      .spyOn(graphQLClient, 'request')
      .mockRejectedValue(new Error('Request failed'));

    await expect(getValidContact(graphQLClient, contacts)).rejects.toThrow(
      'Failed to fetch subgraph'
    );
  });
});

describe('checkProtectedDataValidity', () => {
  it('should return true if protected data is valid', async () => {
    const graphQLClient = new GraphQLClient('');
    jest.spyOn(graphQLClient, 'request').mockResolvedValue({
      protectedDatas: [{ id: 'address1' }],
    });

    const isValid = await checkProtectedDataValidity(graphQLClient, 'address1');

    expect(isValid).toBe(true);
  });
  it('should return false if protected data is invalid', async () => {
    const graphQLClient = new GraphQLClient('');
    jest.spyOn(graphQLClient, 'request').mockResolvedValue({
      protectedDatas: [],
    });

    const isValid = await checkProtectedDataValidity(graphQLClient, 'address2');

    expect(isValid).toBe(false);
  });
  it('should handle error when fetching protected data', async () => {
    const graphQLClient = new GraphQLClient('');
    jest
      .spyOn(graphQLClient, 'request')
      .mockRejectedValue(new Error('Request failed'));

    await expect(
      checkProtectedDataValidity(graphQLClient, 'address1')
    ).rejects.toThrow('Failed to fetch subgraph');
  });
});
