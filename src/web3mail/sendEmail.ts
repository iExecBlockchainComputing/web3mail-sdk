import {
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  WEB3_MAIL_DAPP_ADDRESS,
  WORKERPOOL_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  IExecConsumer,
  SendEmailParams,
  SendEmailResponse,
  SubgraphConsumer,
} from './types.js';
import * as ipfs from './../utils/ipfs-service.js';
export const sendEmail = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  emailSubject,
  emailContent,
  contentType = DEFAULT_CONTENT_TYPE,
  senderName,
  protectedData,
}: IExecConsumer &
  SubgraphConsumer &
  SendEmailParams): Promise<SendEmailResponse> => {
  try {
    const vDatasetAddress = addressOrEnsSchema()
      .required()
      .label('protectedData')
      .validateSync(protectedData);
    const vEmailSubject = emailSubjectSchema()
      .required()
      .label('emailSubject')
      .validateSync(emailSubject);
    const vEmailContent = emailContentSchema()
      .required()
      .label('emailContent')
      .validateSync(emailContent);
    const vContentType = contentTypeSchema()
      .required()
      .label('contentType')
      .validateSync(contentType);
    const vSenderName = senderNameSchema()
      .label('senderName')
      .validateSync(senderName);

    // Check protected data validity through subgraph
    const isValidProtectedData = await checkProtectedDataValidity(
      graphQLClient,
      vDatasetAddress
    );
    if (!isValidProtectedData) {
      throw new Error('ProtectedData is not valid');
    }

    const requesterAddress = await iexec.wallet.getAddress();

    // Initialize IPFS storage if not already initialized
    const isIpfsStorageInitialized =
      await iexec.storage.checkStorageTokenExists(requesterAddress);
    if (!isIpfsStorageInitialized) {
      const token = await iexec.storage.defaultStorageLogin();
      await iexec.storage.pushStorageToken(token);
    }

    // Fetch dataset order
    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      vDatasetAddress,
      {
        app: WEB3_MAIL_DAPP_ADDRESS,
        requester: requesterAddress,
      }
    );
    const datasetorder = datasetOrderbook?.orders[0]?.order;
    if (!datasetorder) {
      throw new Error('Dataset order not found');
    }

    // Fetch app order
    const appOrderbook = await iexec.orderbook.fetchAppOrderbook(
      WEB3_MAIL_DAPP_ADDRESS,
      {
        minTag: ['tee', 'scone'],
        maxTag: ['tee', 'scone'],
        workerpool: WORKERPOOL_ADDRESS,
      }
    );
    const appOrder = appOrderbook?.orders[0]?.order;
    if (!appOrder) {
      throw new Error('App order not found');
    }

    const desiredPriceAppOrderbook = appOrderbook.orders.filter(
      (order) => order.order.appprice <= MAX_DESIRED_APP_ORDER_PRICE
    );
    const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
    if (!desiredPriceAppOrder) {
      throw new Error('No App order found for the desired price');
    }

    // Fetch workerpool order
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app: WEB3_MAIL_DAPP_ADDRESS,
      dataset: vDatasetAddress,
      minTag: ['tee', 'scone'],
      maxTag: ['tee', 'scone'],
      category: 0,
    });

    const workerpoolorder = workerpoolOrderbook?.orders[0]?.order;
    if (!workerpoolorder) {
      throw new Error('Workerpool order not found');
    }

    const desiredPriceWorkerpoolOrderbook = workerpoolOrderbook.orders.filter(
      (order) =>
        order.order.workerpoolprice <= MAX_DESIRED_WORKERPOOL_ORDER_PRICE
    );
    const randomIndex = Math.floor(
      Math.random() * desiredPriceWorkerpoolOrderbook.length
    );
    const desiredPriceWorkerpoolOrder =
      desiredPriceWorkerpoolOrderbook[randomIndex]?.order;
    if (!desiredPriceWorkerpoolOrder) {
      throw new Error('No Workerpool order found for the desired price');
    }

    // Push requester secrets
    const emailSubjectId = generateSecureUniqueId(16);
    const emailContentId = generateSecureUniqueId(16);
    const optionsId = generateSecureUniqueId(16);

    await iexec.secrets.pushRequesterSecret(emailSubjectId, vEmailSubject);
    // create AES encryptionKey & encrypt content
    const emailContentEncryptionKey = iexec.dataset.generateEncryptionKey();
    const dataset = JSON.stringify({
      vEmailContent,
    });
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(dataset, 'utf8'), emailContentEncryptionKey)
      .catch((e) => {
        throw new WorkflowError('Failed to encrypt e-mail content', e);
      });
    // upload encrypted content on IPFS
    const cid = await ipfs.add(encryptedFile).catch((e) => {
      throw new WorkflowError('Failed to upload encrypted e-mail content', e);
    });
    const multiaddr = `/ipfs/${cid}`;
    // set content URL as requester secret 2 (content)
    await iexec.secrets.pushRequesterSecret(emailContentId, multiaddr);
    // set encryptionKey as a field of requester secret 3 (options)
    await iexec.secrets.pushRequesterSecret(
      optionsId,

      JSON.stringify({
        contentType: vContentType,
        senderName: vSenderName,
        emailContentEncryptionKey,
      })
    );
    // Create and sign request order
    const requestorderToSign = await iexec.order.createRequestorder({
      app: WEB3_MAIL_DAPP_ADDRESS,
      category: desiredPriceWorkerpoolOrder.category,
      dataset: vDatasetAddress,
      appmaxprice: desiredPriceAppOrder.appprice,
      workerpoolmaxprice: desiredPriceWorkerpoolOrder.workerpoolprice,
      tag: ['tee', 'scone'],
      workerpool: WORKERPOOL_ADDRESS,
      params: {
        iexec_developer_logger: true,
        iexec_secrets: {
          1: emailSubjectId,
          2: emailContentId,
          3: optionsId,
        },
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    // Match orders and compute task ID
    const { dealid } = await iexec.order.matchOrders({
      apporder: desiredPriceAppOrder,
      datasetorder: datasetorder,
      workerpoolorder: desiredPriceWorkerpoolOrder,
      requestorder: requestorder,
    });
    const taskId = await iexec.deal.computeTaskId(dealid, 0);

    return {
      taskId,
    };
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};
