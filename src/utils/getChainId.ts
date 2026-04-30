import {
  JsonRpcProvider,
  BrowserProvider,
  AbstractProvider,
  AbstractSigner,
  Eip1193Provider,
} from 'ethers';
import { tryResolveChainIdFromProviderString } from '../config/config.js';

type EthersCompatibleProvider =
  | string
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider;

export async function getChainIdFromProvider(
  ethProvider: EthersCompatibleProvider
): Promise<number> {
  try {
    if (typeof ethProvider === 'string') {
      const resolved = tryResolveChainIdFromProviderString(ethProvider);
      if (resolved !== undefined) {
        return resolved;
      }
      const provider = new JsonRpcProvider(ethProvider);
      const network = await provider.getNetwork();
      return Number(network.chainId);
    } else if (ethProvider instanceof AbstractProvider) {
      const network = await ethProvider.getNetwork();
      return Number(network.chainId);
    } else if (ethProvider instanceof AbstractSigner) {
      const { provider } = ethProvider;
      if (!provider) {
        throw Error('Signer is not connected to a provider');
      }
      const network = await provider.getNetwork();
      return Number(network.chainId);
    } else if ('request' in ethProvider) {
      const provider = new BrowserProvider(ethProvider as Eip1193Provider);
      const network = await provider.getNetwork();
      return Number(network.chainId);
    }
  } catch (e) {
    console.warn('Failed to detect chainId:', e);
    throw new Error(
      `Failed to detect chainId from ethProvider: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }
  throw new Error('Unsupported ethProvider for chain ID detection');
}
