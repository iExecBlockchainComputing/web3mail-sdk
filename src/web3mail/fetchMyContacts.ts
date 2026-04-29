import { booleanSchema, throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  SubgraphConsumer,
} from './internalTypes.js';
import { Contact, FetchMyContactsParams } from './types.js';

export type FetchMyContacts = typeof fetchMyContacts;

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddress = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
  isUserStrict = false,
  bulkOnly = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  FetchMyContactsParams): Promise<Contact[]> => {
  const vIsUserStrict = booleanSchema()
    .label('isUserStrict')
    .validateSync(isUserStrict);
  const vBulkOnly = booleanSchema().label('bulkOnly').validateSync(bulkOnly);

  const userAddress = await iexec.wallet.getAddress();
  return fetchUserContacts({
    iexec,
    graphQLClient,
    dappAddress,
    dappWhitelistAddress,
    userAddress,
    isUserStrict: vIsUserStrict,
    bulkOnly: vBulkOnly,
  });
};
