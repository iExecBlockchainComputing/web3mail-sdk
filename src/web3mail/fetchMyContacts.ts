import {
  WEB3_MAIL_DAPP_ADDRESS,
  WHITELIST_SMART_CONTRACT_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import { throwIfMissing } from '../utils/validators.js';
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
    const datasetOrderbookAuthorizedBySC =
      await iexec.orderbook.fetchDatasetOrderbook('any', {
        app: WHITELIST_SMART_CONTRACT_ADDRESS,
        requester: userAddress,
        page,
        pageSize,
      });
    const datasetOrderbookAuthorizedByENS =
      await iexec.orderbook.fetchDatasetOrderbook('any', {
        app: WEB3_MAIL_DAPP_ADDRESS,
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

    const validContacts = await getValidContact(graphQLClient, myContacts);

    return validContacts;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
