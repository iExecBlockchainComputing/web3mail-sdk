import { jest } from '@jest/globals';

// Mock graphql-request before importing the module under test
const mockRequest = jest.fn();
const mockGql = jest.fn((literals) => literals.join(''));

jest.unstable_mockModule('graphql-request', () => ({
  gql: mockGql,
  request: mockRequest,
}));

// Import after mocking
const { default: checkEmailPreviousValidation } = await import(
  '../../src/checkEmailPreviousValidation'
);

describe('checkEmailPreviousValidation', () => {
  const datasetAddress = '0x9585b5427503e69d61b9db2adbc14e0853075ef0';
  const dappAddresses = ['0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true if a valid email verification callback exists', async () => {
    mockRequest.mockResolvedValue({
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
    mockRequest.mockResolvedValue({ tasks: [] });

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(false);
  });

  it('returns false if none of the callbacks indicate a valid verification', async () => {
    mockRequest.mockResolvedValue({
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
    mockRequest.mockRejectedValue(new Error('GraphQL request failed'));

    const result = await checkEmailPreviousValidation({
      datasetAddress,
      dappAddresses,
    });
    expect(result).toBe(false);
  });
});
