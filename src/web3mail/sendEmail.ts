import {
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  WHITELIST_SMART_CONTRACT_ADDRESS,
  PROD_WORKERPOOL_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  labelSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  DappAddressConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SendEmailParams,
  SendEmailResponse,
  SubgraphConsumer,
} from './types.js';

export const sendEmail = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  workerpoolAddressOrEns = PROD_WORKERPOOL_ADDRESS,
  dappAddressOrENS,
  ipfsNode,
  ipfsGateway,
  emailSubject,
  emailContent,
  contentType = DEFAULT_CONTENT_TYPE,
  label,
  dataMaxPrice = MAX_DESIRED_DATA_ORDER_PRICE,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  senderName,
  protectedData,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
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
    const vLabel = labelSchema().label('label').validateSync(label);

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
        app: dappAddressOrENS,
        requester: requesterAddress,
      }
    );
    // Fetch dataset order for whitelist address
    const datasetWhitelistOrderbook =
      await iexec.orderbook.fetchDatasetOrderbook(vDatasetAddress, {
        app: WHITELIST_SMART_CONTRACT_ADDRESS,
        requester: requesterAddress,
      });
    const datasetorder = datasetOrderbook?.orders[0]?.order;
    const datasetWhitelistorder = datasetWhitelistOrderbook?.orders[0]?.order;
    if (!datasetorder && !datasetWhitelistorder) {
      throw new Error('Dataset order not found');
    }
    const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
      (order) => order.order.datasetprice <= dataMaxPrice
    );
    const desiredPriceDataOrder = desiredPriceDataOrderbook[0]?.order;
    const desiredPriceDataWhitelistOrderbook =
      datasetWhitelistOrderbook.orders.filter(
        (order) => order.order.datasetprice <= dataMaxPrice
      );
    if (!desiredPriceDataOrder && !desiredPriceDataWhitelistOrderbook) {
      throw new Error('No Dataset order found for the desired price');
    }

    // Fetch app order
    const appOrderbook = await iexec.orderbook.fetchAppOrderbook(
      dappAddressOrENS,
      {
        minTag: ['tee', 'scone'],
        maxTag: ['tee', 'scone'],
        workerpool: workerpoolAddressOrEns,
      }
    );
    const appOrder = appOrderbook?.orders[0]?.order;
    if (!appOrder) {
      throw new Error('App order not found');
    }

    const desiredPriceAppOrderbook = appOrderbook.orders.filter(
      (order) => order.order.appprice <= appMaxPrice
    );
    const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
    if (!desiredPriceAppOrder) {
      throw new Error('No App order found for the desired price');
    }

    // Fetch workerpool order
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: workerpoolAddressOrEns,
      app: dappAddressOrENS,
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
      (order) => order.order.workerpoolprice <= workerpoolMaxPrice
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
    const requesterSecretId = generateSecureUniqueId(16);
    const emailContentEncryptionKey = iexec.dataset.generateEncryptionKey();
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(vEmailContent, 'utf8'), emailContentEncryptionKey)
      .catch((e) => {
        throw new WorkflowError('Failed to encrypt email content', e);
      });
    const cid = await ipfs
      .add(encryptedFile, {
        ipfsNode: ipfsNode,
        ipfsGateway: ipfsGateway,
      })
      .catch((e) => {
        throw new WorkflowError('Failed to upload encrypted email content', e);
      });
    const multiaddr = `/ipfs/${cid}`;

    await iexec.secrets.pushRequesterSecret(
      requesterSecretId,
      JSON.stringify({
        emailSubject: vEmailSubject,
        emailContentMultiAddr: multiaddr,
        contentType: vContentType,
        senderName: vSenderName,
        emailContentEncryptionKey,
      })
    );

    const requestorderToSign = await iexec.order.createRequestorder({
      app: dappAddressOrENS,
      category: desiredPriceWorkerpoolOrder.category,
      dataset: vDatasetAddress,
      datasetmaxprice: datasetorder
        ? datasetorder.datasetprice
        : datasetWhitelistorder.datasetprice,
      appmaxprice: desiredPriceAppOrder.appprice,
      workerpoolmaxprice: desiredPriceWorkerpoolOrder.workerpoolprice,
      tag: ['tee', 'scone'],
      workerpool: workerpoolAddressOrEns,
      params: {
        iexec_developer_logger: true,
        iexec_secrets: {
          1: requesterSecretId,
        },
        iexec_args: vLabel,
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    // Match orders and compute task ID
    const { dealid } = await iexec.order.matchOrders({
      apporder: desiredPriceAppOrder,
      datasetorder: datasetorder ? datasetorder : datasetWhitelistorder,
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
