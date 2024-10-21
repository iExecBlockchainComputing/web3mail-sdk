import { Buffer } from 'buffer';
import {
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  PROD_WORKERPOOL_ADDRESS,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  addressSchema,
  booleanSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  labelSchema,
  positiveNumberSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SendEmailParams,
  SendEmailResponse,
  SubgraphConsumer,
} from './types.js';

export type SendEmail = typeof sendEmail;

export const sendEmail = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  workerpoolAddressOrEns = PROD_WORKERPOOL_ADDRESS,
  dappAddressOrENS,
  dappWhitelistAddress,
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
  useVoucher = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  SendEmailParams): Promise<SendEmailResponse> => {
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
  const vWorkerpoolAddressOrEns = addressOrEnsSchema()
    .required()
    .label('WorkerpoolAddressOrEns')
    .validateSync(workerpoolAddressOrEns);
  const vDappAddressOrENS = addressOrEnsSchema()
    .required()
    .label('dappAddressOrENS')
    .validateSync(dappAddressOrENS);
  const vDappWhitelistAddress = addressSchema()
    .required()
    .label('dappWhitelistAddress')
    .validateSync(dappWhitelistAddress);
  const vDataMaxPrice = positiveNumberSchema()
    .label('dataMaxPrice')
    .validateSync(dataMaxPrice);
  const vAppMaxPrice = positiveNumberSchema()
    .label('appMaxPrice')
    .validateSync(appMaxPrice);
  const vWorkerpoolMaxPrice = positiveNumberSchema()
    .label('workerpoolMaxPrice')
    .validateSync(workerpoolMaxPrice);
  const vUseVoucher = booleanSchema()
    .label('useVoucher')
    .validateSync(useVoucher);

  try {
    // Check protected data validity through subgraph
    const isValidProtectedData = await checkProtectedDataValidity(
      graphQLClient,
      vDatasetAddress
    );
    if (!isValidProtectedData) {
      throw new Error(
        'This protected data does not contain "email:string" in its schema.'
      );
    }

    const requesterAddress = await iexec.wallet.getAddress();

    const [
      datasetorderForApp,
      datasetorderForWhitelist,
      apporder,
      workerpoolorderForApp,
      workerpoolorderForWhitelist,
    ] = await Promise.all([
      // Fetch dataset order for web3mail app
      iexec.orderbook
        .fetchDatasetOrderbook(vDatasetAddress, {
          app: dappAddressOrENS,
          requester: requesterAddress,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),
      // Fetch dataset order for web3mail whitelist
      iexec.orderbook
        .fetchDatasetOrderbook(vDatasetAddress, {
          app: vDappWhitelistAddress,
          requester: requesterAddress,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),
      // Fetch app order
      iexec.orderbook
        .fetchAppOrderbook(dappAddressOrENS, {
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          workerpool: workerpoolAddressOrEns,
        })
        .then((appOrderbook) => {
          const desiredPriceAppOrderbook = appOrderbook.orders.filter(
            (order) => order.order.appprice <= vAppMaxPrice
          );
          const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
          if (!desiredPriceAppOrder) {
            throw new Error('No App order found for the desired price');
          }
          return desiredPriceAppOrder;
        }),
      // Fetch workerpool order for App
      iexec.orderbook
        .fetchWorkerpoolOrderbook({
          workerpool: workerpoolAddressOrEns,
          app: dappAddressOrENS,
          dataset: vDatasetAddress,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        })
        .then((workerpoolOrderbook) => {
          const desiredPriceWorkerpoolOrderbook =
            workerpoolOrderbook.orders.filter(
              (order) => order.order.workerpoolprice <= vWorkerpoolMaxPrice
            );
          const randomIndex = Math.floor(
            Math.random() * desiredPriceWorkerpoolOrderbook.length
          );
          const desiredPriceWorkerpoolOrder =
            desiredPriceWorkerpoolOrderbook[randomIndex]?.order;
          return desiredPriceWorkerpoolOrder;
        }),
      // Fetch workerpool order for AppWhitelist
      iexec.orderbook
        .fetchWorkerpoolOrderbook({
          workerpool: workerpoolAddressOrEns,
          app: vDappWhitelistAddress,
          dataset: vDatasetAddress,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        })
        .then((workerpoolOrderbook) => {
          const desiredPriceWorkerpoolOrderbook =
            workerpoolOrderbook.orders.filter(
              (order) => order.order.workerpoolprice <= vWorkerpoolMaxPrice
            );
          const randomIndex = Math.floor(
            Math.random() * desiredPriceWorkerpoolOrderbook.length
          );
          const desiredPriceWorkerpoolOrder =
            desiredPriceWorkerpoolOrderbook[randomIndex]?.order;
          return desiredPriceWorkerpoolOrder;
        }),
    ]);

    let workerpoolorder;
    if (workerpoolorderForApp && workerpoolorderForWhitelist) {
      // get cheapest order
      workerpoolorder =
        workerpoolorderForApp.workerpoolprice <
        workerpoolorderForWhitelist.workerpoolprice
          ? workerpoolorderForApp
          : workerpoolorderForWhitelist;
    } else {
      workerpoolorder = workerpoolorderForApp || workerpoolorderForWhitelist;
    }
    if (!workerpoolorder) {
      throw new Error('No Workerpool order found for the desired price');
    }

    const datasetorder = datasetorderForApp || datasetorderForWhitelist;
    if (!datasetorder) {
      throw new Error('No Dataset order found for the desired price');
    }

    // Push requester secrets
    const requesterSecretId = generateSecureUniqueId(16);
    const emailContentEncryptionKey = iexec.dataset.generateEncryptionKey();
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(vEmailContent, 'utf8'), emailContentEncryptionKey)
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to encrypt email content',
          errorCause: e,
        });
      });
    const cid = await ipfs
      .add(encryptedFile, {
        ipfsNode: ipfsNode,
        ipfsGateway: ipfsGateway,
      })
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to upload encrypted email content',
          errorCause: e,
        });
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
      app: vDappAddressOrENS,
      category: workerpoolorder.category,
      dataset: vDatasetAddress,
      datasetmaxprice: datasetorder.datasetprice,
      appmaxprice: apporder.appprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      tag: ['tee', 'scone'],
      workerpool: vWorkerpoolAddressOrEns,
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
    const { dealid } = await iexec.order.matchOrders(
      {
        apporder: apporder,
        datasetorder: datasetorder,
        workerpoolorder: workerpoolorder,
        requestorder: requestorder,
      },
      { useVoucher: vUseVoucher }
    );
    const taskId = await iexec.deal.computeTaskId(dealid, 0);

    return {
      taskId,
    };
  } catch (error) {
    handleIfProtocolError(error);

    throw new WorkflowError({
      message: 'Failed to sendEmail',
      errorCause: error,
    });
  }
};
