import { handleProtocolError, WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  Contact,
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddressOrENS = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    return await fetchUserContacts({
      iexec,
      graphQLClient,
      dappAddressOrENS,
      dappWhitelistAddress,
      userAddress,
    });
  } catch (error) {
    if (!handleProtocolError(error)) {
      throw new WorkflowError(
        `Failed to fetch my contacts: ${error.message}`,
        error
      );
    }
  }
};
