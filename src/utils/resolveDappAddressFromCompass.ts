import { CompassCallError } from 'iexec/errors';
import { AddressOrENS } from '../web3mail/types.js';

export async function resolveDappAddressFromCompass(
  compassUrl: string,
  chainId: number
): Promise<AddressOrENS | undefined> {
  if (!compassUrl) {
    return undefined;
  }

  const address = await fetch(`${compassUrl}/${chainId}/iapps/web3mail`)
    // Handle network errors
    .catch((error) => {
      throw new CompassCallError(
        `Connection to ${compassUrl} failed with a network error`,
        error
      );
    })
    // Handle server errors
    .then((response) => {
      if (response.status >= 500 && response.status <= 599) {
        throw new CompassCallError(
          `Server at ${compassUrl} encountered an internal error`,
          Error(
            `Server internal error: ${response.status} ${response.statusText}`
          )
        );
      }
      return response;
    })
    // Handle unexpected response formats
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch dapp address from compass: ${response.statusText}`
        );
      }
      if (response.headers.get('Content-Type') !== 'application/json') {
        throw new Error(
          'Failed to fetch dapp address from compass: response is not JSON'
        );
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !data.address) {
        throw new Error(`No dapp address found in compass response`);
      }
      return data.address;
    });

  return address;
}
