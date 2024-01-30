import { ANY_DATASET_ADDRESS } from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  addressSchema,
  isEnsTest,
  throwIfMissing,
} from '../utils/validators.js';
import {
  Contact,
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  FetchUserContactsParams,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchUserContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddressOrENS = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
  userAddress,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  FetchUserContactsParams): Promise<Contact[]> => {
  try {
    const vDappAddressOrENS = addressOrEnsSchema()
      .required()
      .label('dappAddressOrENS')
      .validateSync(dappAddressOrENS);
    const vDappWhitelistAddress = addressSchema()
      .required()
      .label('dappWhitelistAddress')
      .validateSync(dappWhitelistAddress);
    const vUserAddress = addressOrEnsSchema()
      .required()
      .label('userAddress')
      .validateSync(userAddress);

    const [ensOrders, scOrders] = await Promise.all([
      fetchAllOrdersByApp({
        iexec,
        vUserAddress,
        appAddress: dappAddressOrENS,
      }),
      fetchAllOrdersByApp({
        iexec,
        vUserAddress,
        appAddress: vDappWhitelistAddress,
      }),
    ]);

    const orders = ensOrders.concat(scOrders);
    const myContacts: Contact[] = [];
    let web3DappResolvedAddress = vDappAddressOrENS;
    if (isEnsTest(vDappAddressOrENS)) {
      web3DappResolvedAddress = await iexec.ens.resolveName(vDappAddressOrENS);
    }
    orders.forEach((order) => {
      if (
        order.order.apprestrict.toLowerCase() ===
          web3DappResolvedAddress.toLowerCase() ||
        order.order.apprestrict.toLowerCase() ===
          vDappWhitelistAddress.toLowerCase()
      ) {
        const contact = {
          address: order.order.dataset.toLowerCase(),
          owner: order.signer.toLowerCase(),
          accessGrantTimestamp: order.publicationTimestamp,
        };
        myContacts.push(contact);
      }
    });

    //getValidContact function remove duplicated contacts for the same protectedData address,
    //keeping the most recent one
    return await getValidContact(graphQLClient, myContacts);
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};

async function fetchAllOrdersByApp({ iexec, vUserAddress, appAddress }) {
  const ordersFirstPage = iexec.orderbook.fetchDatasetOrderbook(
    ANY_DATASET_ADDRESS,
    {
      app: appAddress,
      requester: vUserAddress,
      // Use maxPageSize here to avoid too many round-trips (we want everything anyway)
      pageSize: 1000,
    }
  );
  const { orders: allOrders } = await autoPaginateRequest({
    request: ordersFirstPage,
  });
  return allOrders;
}
