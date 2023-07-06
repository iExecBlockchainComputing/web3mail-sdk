import { WEB3_MAIL_DAPP_ADDRESS } from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { autoPaginateRequest } from '../utils/paginate.js';
import { getValidContact } from '../utils/subgraphQuery.js';
import { address, throwIfMissing } from '../utils/validators.js';
import {
  Contact,
  FetchUserContactsParams,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';

export const fetchUserContacts = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  address,
}: IExecConsumer & SubgraphConsumer & FetchUserContactsParams): Promise<
  Contact[]
> => {
  //TODO : accept an ENS & resolve it if its one
  const vAddress = address()
    .required()
    .label('userAddress')
    .validateSync(address);

  try {
    const showDatasetOrderbookRequest = iexec.orderbook.fetchDatasetOrderbook(
      'any',
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
        requester: vAddress,
      }
    );
    const { orders } = await autoPaginateRequest({
      request: showDatasetOrderbookRequest,
    });
    let myContacts: Contact[] = [];
    const web3DappResolvedAddress = await iexec.ens.resolveName(
      WEB3_MAIL_DAPP_ADDRESS
    );

    orders.forEach((order) => {
      if (
        order.order.apprestrict.toLowerCase() ===
        web3DappResolvedAddress.toLowerCase()
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
