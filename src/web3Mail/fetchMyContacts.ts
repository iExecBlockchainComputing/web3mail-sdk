import { IExecConsumer } from './types.js';

import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
export const fetchMyContacts = async ({
  iexec = throwIfMissing(),
}: IExecConsumer): Promise<Array<Object>> => {
  try {
    //TODO: wait for low level sdk implementation
    /*
    const userAddress = await iexec.wallet.getAddress();
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook({
      dataset: ANY_DATASET,
      app: WEB3_MAIL_DAPP_ADDRESS,
      requester: userAddress,
    }); */
    return [];
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch my contacts: ${error.message}`,
      error
    );
  }
};
