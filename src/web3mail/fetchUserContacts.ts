import { PublishedDatasetorder } from 'iexec/IExecOrderbookModule';
import { ZeroAddress } from 'ethers';
import { IExec } from 'iexec';
import { ANY_DATASET_ADDRESS } from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  addressSchema,
  booleanSchema,
  isEnsTest,
  throwIfMissing,
} from '../utils/validators.js';
import { Contact, FetchUserContactsParams } from './types.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  SubgraphConsumer,
} from './internalTypes.js';

export const fetchUserContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dappAddressOrENS = throwIfMissing(),
  dappWhitelistAddress = throwIfMissing(),
  userAddress,
  isUserStrict = false,
  bulkOnly = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  FetchUserContactsParams): Promise<Contact[]> => {
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
  const vIsUserStrict = booleanSchema()
    .label('isUserStrict')
    .validateSync(isUserStrict);
  const vBulkOnly = booleanSchema().label('bulkOnly').validateSync(bulkOnly);

  try {
    const [dappOrders, whitelistOrders] = await Promise.all([
      fetchAllOrdersByApp({
        iexec,
        userAddress: vUserAddress,
        appAddress: vDappAddressOrENS,
        isUserStrict: vIsUserStrict,
        bulkOnly: vBulkOnly,
      }),
      fetchAllOrdersByApp({
        iexec,
        userAddress: vUserAddress,
        appAddress: vDappWhitelistAddress,
        isUserStrict: vIsUserStrict,
        bulkOnly: vBulkOnly,
      }),
    ]);

    const orders = dappOrders.concat(whitelistOrders);
    const myContacts: Omit<Contact, 'name'>[] = [];
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
          remainingAccess: order.remaining,
          accessPrice: order.order.datasetprice,
          accessGrantTimestamp: order.publicationTimestamp,
          isUserStrict: order.order.requesterrestrict !== ZeroAddress,
          grantedAccess: {
            dataset: order.order.dataset,
            datasetprice: order.order.datasetprice.toString(),
            volume: order.order.volume.toString(),
            tag: order.order.tag.toString(),
            apprestrict: order.order.apprestrict,
            workerpoolrestrict: order.order.workerpoolrestrict,
            requesterrestrict: order.order.requesterrestrict,
            salt: order.order.salt,
            sign: order.order.sign,
            remainingAccess: order.remaining,
          },
        };
        myContacts.push(contact);
      }
    });

    //getValidContact function remove duplicated contacts for the same protectedData address,
    //keeping the most recent one
    return await getValidContact(graphQLClient, myContacts);
  } catch (error) {
    handleIfProtocolError(error);

    throw new WorkflowError({
      message: 'Failed to fetch user contacts',
      errorCause: error,
    });
  }
};

async function fetchAllOrdersByApp({
  iexec,
  userAddress,
  appAddress,
  isUserStrict,
  bulkOnly,
}: {
  iexec: IExec;
  userAddress: string;
  appAddress: string;
  isUserStrict: boolean;
  bulkOnly: boolean;
}): Promise<PublishedDatasetorder[]> {
  const ordersFirstPage = iexec.orderbook.fetchDatasetOrderbook({
    dataset: ANY_DATASET_ADDRESS,
    app: appAddress,
    requester: userAddress,
    isAppStrict: true,
    isRequesterStrict: isUserStrict,
    bulkOnly,
    // Use maxPageSize here to avoid too many round-trips (we want everything anyway)
    pageSize: 1000,
  });
  const { orders: allOrders } = await autoPaginateRequest({
    request: ordersFirstPage,
  });
  return allOrders;
}
