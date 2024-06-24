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
  const userAddress = await iexec.wallet.getAddress();
  return fetchUserContacts({
    iexec,
    graphQLClient,
    dappAddressOrENS,
    dappWhitelistAddress,
    userAddress,
  });
};
