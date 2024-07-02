import { booleanSchema, throwIfMissing } from '../utils/validators.js';
import { fetchUserContacts } from './fetchUserContacts.js';
import {
  Contact,
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  FetchMyContactsParams,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddressOrENS = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
  isUserStrict = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  FetchMyContactsParams): Promise<Contact[]> => {
  const vIsUserStrict = booleanSchema()
    .label('isUserStrict')
    .validateSync(isUserStrict);

  const userAddress = await iexec.wallet.getAddress();
  return fetchUserContacts({
    iexec,
    graphQLClient,
    dappAddressOrENS,
    dappWhitelistAddress,
    userAddress,
    isUserStrict: vIsUserStrict,
  });
};
