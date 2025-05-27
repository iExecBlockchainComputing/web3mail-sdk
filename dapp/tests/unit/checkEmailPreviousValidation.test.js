const { request } = require('graphql-request');
const {
  checkEmailPreviousValidation,
} = require('../../src/checkEmailPreviousValidation');

jest.mock('graphql-request', () => ({
  gql: jest.fn((literals) => literals.join('')), // pass-through for query template
  request: jest.fn(),
}));

describe('checkEmailPreviousValidation', () => {
  const datasetAddress = '0x9585b5427503e69d61b9db2adbc14e0853075ef0';
  const dappAddresses = ['0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true if a valid email verification callback exists', async () => {
    request.mockResolvedValue({
      tasks: [
        {
          resultsCallback:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      ],
    });

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(true);
  });

  it('returns false if no tasks are returned', async () => {
    request.mockResolvedValue({ tasks: [] });

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(false);
  });

  it('returns false if none of the callbacks indicate a valid verification', async () => {
    request.mockResolvedValue({
      tasks: [
        {
          resultsCallback:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        {
          resultsCallback:
            '0xabcdef1234567890abcdef000000000000000000000000000000000000000000',
        },
      ],
    });

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(false);
  });

  it('returns false if GraphQL query fails', async () => {
    request.mockRejectedValue(new Error('GraphQL request failed'));

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(false);
  });
});
