import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import { throwIfMissing } from '../utils/validators.js';
import {
  Contact,
  FetchContactsParams,
  IExecConsumer,
  SubgraphConsumer,
  DappAddressConsumer,
  DppWhitelistAddressConsumer,
} from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddressOrENS = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
  page,
  pageSize,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DppWhitelistAddressConsumer &
  FetchContactsParams): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    const datasetOrderbookAuthorizedBySC =
      await iexec.orderbook.fetchDatasetOrderbook('any', {
        app: dappWhitelistAddress,
        requester: userAddress,
        page,
        pageSize,
      });
    const datasetOrderbookAuthorizedByENS =
      await iexec.orderbook.fetchDatasetOrderbook('any', {
        app: dappAddressOrENS,
        requester: userAddress,
        page,
        pageSize,
      });

    const { orders: ensOrders } = await autoPaginateRequest({
      request: datasetOrderbookAuthorizedByENS,
    });
    const { orders: scOrders } = await autoPaginateRequest({
      request: datasetOrderbookAuthorizedBySC,
    });

    const orders = ensOrders.concat(scOrders);
    const myContacts: Contact[] = [];
    const web3DappResolvedAddress = await iexec.ens.resolveName(
      dappAddressOrENS
    );

    orders.forEach((order) => {
      if (
        order.order.apprestrict.toLowerCase() ===
          web3DappResolvedAddress.toLowerCase() ||
        order.order.apprestrict.toLowerCase() ===
          dappWhitelistAddress.toLowerCase()
      ) {
        const contact = {
          address: order.order.dataset.toLowerCase(),
          owner: order.signer.toLowerCase(),
          accessGrantTimestamp: order.publicationTimestamp,
        };
        myContacts.push(contact);
      }
    });

    return await getValidContact(graphQLClient, myContacts);
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
