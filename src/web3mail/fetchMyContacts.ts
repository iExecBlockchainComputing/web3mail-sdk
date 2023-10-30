import {
  WEB3_MAIL_DAPP_ADDRESS,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import { throwIfMissing } from '../utils/validators.js';
import { Contact, IExecConsumer, SubgraphConsumer } from './types.js';

export const fetchMyContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
}: IExecConsumer & SubgraphConsumer): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    const [datasetOrderbookAuthorizedBySC, datasetOrderbookAuthorizedByENS] =
      await Promise.all([
        iexec.orderbook.fetchDatasetOrderbook('any', {
          app: WHITELIST_SMART_CONTRACT_ADDRESS,
          requester: userAddress,
          // Use maxPageSize here to avoid too many round-trips (we want everything anyway)
          pageSize: 1000,
        }),
        iexec.orderbook.fetchDatasetOrderbook('any', {
          app: WEB3_MAIL_DAPP_ADDRESS,
          requester: userAddress,
          // Use maxPageSize here to avoid too many round-trips (we want everything anyway)
          pageSize: 1000,
        }),
      ]);

    const { orders: ensOrders } = await autoPaginateRequest({
      request: datasetOrderbookAuthorizedByENS,
    });
    const { orders: scOrders } = await autoPaginateRequest({
      request: datasetOrderbookAuthorizedBySC,
    });

    const orders = ensOrders.concat(scOrders);
    const myContacts: Contact[] = [];
    const web3DappResolvedAddress = await iexec.ens.resolveName(
      WEB3_MAIL_DAPP_ADDRESS
    );

    orders.forEach((order) => {
      if (
        order.order.apprestrict.toLowerCase() ===
          web3DappResolvedAddress.toLowerCase() ||
        order.order.apprestrict.toLowerCase() ===
          WHITELIST_SMART_CONTRACT_ADDRESS.toLowerCase()
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
