import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  Contact,
  DappAddressConsumer,
  DppWhitelistAddressConsumer,
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
  DppWhitelistAddressConsumer): Promise<Contact[]> => {
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
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
