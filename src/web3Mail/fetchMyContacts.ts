import { Contact, IExecConsumer } from './types.js';

import { WEB3_MAIL_DAPP_ADDRESS } from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
export const fetchMyContacts = async ({
  iexec = throwIfMissing(),
}: IExecConsumer): Promise<Contact[]> => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook('any', {
      app: WEB3_MAIL_DAPP_ADDRESS,
      requester: userAddress,
    });
    const myContacts: Contact[] = [];
    orders.map((order) => {
      const contact = {
        address: order.order.dataset,
        owner: order.signer,
        accessGrantTimestamp: order.publicationTimestamp,
      };
      myContacts.push(contact);
    });
    return myContacts;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
