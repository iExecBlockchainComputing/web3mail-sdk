import { describe, it, expect } from '@jest/globals';
import { resolveDappAddressFromCompass } from '../../../src/utils/resolveDappAddressFromCompass.js';

describe('resolveDappAddressFromCompass', () => {
  it('should return undefined if compassUrl is not provided', async () => {
    const result = await resolveDappAddressFromCompass('', 1);
    expect(result).toBeUndefined();
  });

  it('should resolve dapp address from a valid compass instance', async () => {
    const compassUrl = 'https://compass.arbitrum-sepolia-testnet.iex.ec';
    const chainId = 421614;
    const address = await resolveDappAddressFromCompass(compassUrl, chainId);
    expect(address).toBeDefined();
  });

  it('should throw CompassCallError on network error', async () => {
    const compassUrl = 'https://invalid-url.iex.ec';
    await expect(resolveDappAddressFromCompass(compassUrl, 1)).rejects.toThrow(
      'Compass API error: Connection to https://invalid-url.iex.ec failed with a network error'
    );
  });
});
