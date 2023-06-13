import { WEB3_MAIL_DAPP_ADDRESS } from '../config/config.js';
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
    const showDatasetOrderbookRequest = iexec.orderbook.fetchDatasetOrderbook(
      'any',
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
        requester: userAddress,
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
