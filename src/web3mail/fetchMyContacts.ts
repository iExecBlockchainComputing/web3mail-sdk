import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  Contact,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
}: IExecConsumer & SubgraphConsumer): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    return await fetchUserContacts({
      iexec,
      graphQLClient,
      userAddress,
    });
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};