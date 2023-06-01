import { IExecConsumer, SendEmailParams, SendEmailResponse } from './types.js';
import {
  WEB3_MAIL_DAPP_ADDRESS,
  WORKERPOOL_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
const sendEmail = async ({
  iexec = throwIfMissing(),
  mailObject = throwIfMissing(),
  mailContent = throwIfMissing(),
  protectedData = throwIfMissing(),
}: IExecConsumer & SendEmailParams): Promise<SendEmailResponse> => {
  try {
    const requesterAddress = await iexec.wallet.getAddress();
    // Initialize IPFS storage if not already initialized
    const isIpfsStorageInitialized =
      await iexec.storage.checkStorageTokenExists(requesterAddress);
    if (!isIpfsStorageInitialized) {
      const token = await iexec.storage.defaultStorageLogin();
      await iexec.storage.pushStorageToken(token);
    }
    // Fetch dataset order
    const datasetOrderBook = await iexec.orderbook.fetchDatasetOrderbook(
      protectedData,
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
        requester: requesterAddress,
      }
    );
    const datasetorder = datasetOrderBook?.orders[0]?.order;
    if (!datasetorder) {
      throw new Error('Dataset order not found');
    }
    // Fetch app order
    const apporderbook = await iexec.orderbook.fetchAppOrderbook(
      WEB3_MAIL_DAPP_ADDRESS,
      {
        minTag: ['tee', 'scone'],
        maxTag: ['tee', 'scone'],
        workerpool: WORKERPOOL_ADDRESS,
      }
    );
    const apporder = apporderbook?.orders[0]?.order;
    if (!apporder) {
      throw new Error('App order not found');
    }
    // Fetch workerpool order
    const workerpoolorderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app: WEB3_MAIL_DAPP_ADDRESS,
      dataset: protectedData,
      minTag: ['tee', 'scone'],
    });
    const workerpoolorder = workerpoolorderbook?.orders[0]?.order;
    if (!workerpoolorder) {
      throw new Error('Workerpool order not found');
    }
    // Push requester secrets
    const mailObjectId = generateSecureUniqueId(16);
    const mailContentId = generateSecureUniqueId(16);
    await iexec.secrets.pushRequesterSecret(mailObjectId, mailObject);
    await iexec.secrets.pushRequesterSecret(mailContentId, mailContent);
    // Create and sign request order
    const requestorderToSign = await iexec.order.createRequestorder({
      app: WEB3_MAIL_DAPP_ADDRESS,
      category: workerpoolorder.category,
      dataset: protectedData,
      appmaxprice: apporder.appprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      tag: ['tee', 'scone'],
      workerpool: WORKERPOOL_ADDRESS,
      params: {
        iexec_developer_logger: true,
        iexec_secrets: {
          1: mailObjectId,
          2: mailContentId,
        },
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);
    // Match orders and compute task ID
    const { dealid } = await iexec.order.matchOrders({
      apporder,
      datasetorder,
      workerpoolorder,
      requestorder,
    });
    const taskId = await iexec.deal.computeTaskId(dealid, 0);

    return {
      taskId,
    };
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};

export default sendEmail;
