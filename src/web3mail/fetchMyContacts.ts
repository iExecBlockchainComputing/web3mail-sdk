import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  Contact,
  FetchContactsParams,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  page,
  pageSize,
}: IExecConsumer & SubgraphConsumer & FetchContactsParams): Promise<
  Contact[]
> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    return await fetchUserContacts({
      iexec,
      graphQLClient,
      user,
      page,
      pageSize,
    });
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
