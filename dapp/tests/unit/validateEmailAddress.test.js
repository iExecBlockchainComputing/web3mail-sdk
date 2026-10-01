jest.mock('node-fetch');
const fetch = require('node-fetch');
const { validateEmailAddress } = require('../../src/validateEmailAddress');

function mockBouncerResponse({ ok = true, status = 200, json = {} }) {
  fetch.mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(json),
  });
}

describe('validateEmailAddress', () => {
  beforeEach(() => {
    fetch.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('calls Bouncer verify endpoint with the api key', async () => {
    mockBouncerResponse({ json: { status: 'deliverable' } });

    await validateEmailAddress({
      emailAddress: 'john+test@example.com',
      bouncerApiKey: 'my-api-key',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.usebouncer.com/v1.1/email/verify?email=john%2Btest%40example.com',
      { method: 'GET', headers: { 'x-api-key': 'my-api-key' } }
    );
  });

  it('returns true when status is "deliverable"', async () => {
    mockBouncerResponse({
      json: { status: 'deliverable', reason: 'accepted_email' },
    });
    await expect(
      validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
    ).resolves.toBe(true);
  });

  it('returns false when status is "undeliverable"', async () => {
    mockBouncerResponse({
      json: { status: 'undeliverable', reason: 'rejected_email' },
    });
    await expect(
      validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
    ).resolves.toBe(false);
  });

  it('returns false when status is "risky"', async () => {
    mockBouncerResponse({
      json: { status: 'risky', reason: 'low_quality' },
    });
    await expect(
      validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
    ).resolves.toBe(false);
  });

  it('returns undefined when status is "unknown"', async () => {
    mockBouncerResponse({ json: { status: 'unknown', reason: 'timeout' } });
    await expect(
      validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
    ).resolves.toBeUndefined();
  });

  it.each([401, 402, 429, 500])(
    'returns undefined when Bouncer answers with HTTP %i',
    async (status) => {
      mockBouncerResponse({ ok: false, status });
      await expect(
        validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
      ).resolves.toBeUndefined();
    }
  );

  it('returns undefined when the request fails', async () => {
    fetch.mockRejectedValue(new Error('network error'));
    await expect(
      validateEmailAddress({ emailAddress: 'a@b.com', bouncerApiKey: 'k' })
    ).resolves.toBeUndefined();
  });
});
