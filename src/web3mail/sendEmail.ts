import { Buffer } from 'buffer';
import {
  CALLBACK_WEB3MAIL,
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import { generateSecureUniqueId } from '../utils/generateUniqueId.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  labelSchema,
  positiveNumberSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { filterWorkerpoolOrders } from './sendEmail.models.js';
import { SendEmailParams, SendEmailResponse } from './types.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SubgraphConsumer,
} from './internalTypes.js';

export type SendEmail = typeof sendEmail;

export const sendEmail = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  workerpoolAddress,
  dappAddress,
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
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  SendEmailParams): Promise<SendEmailResponse> => {
  const vDatasetAddress = addressSchema()
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

  const vWorkerpoolAddress = addressSchema()
    .required()
    .label('workerpoolAddress')
    .validateSync(workerpoolAddress);

  const vDappAddress = addressSchema()
    .required()
    .label('dappAddress')
    .validateSync(dappAddress);

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

  // Check protected data schema through subgraph
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

  try {
    // Fetch app order first to determine TEE framework
    const apporder = await iexec.orderbook
      .fetchAppOrderbook({
        app: vDappAddress,
        minTag: ['tee'],
        workerpool: vWorkerpoolAddress,
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
      });

    const workerpoolMinTag = apporder.tag;

    const [datasetorderForApp, datasetorderForWhitelist, workerpoolorder] =
      await Promise.all([
        // Fetch dataset order for web3mail app
        iexec.orderbook
          .fetchDatasetOrderbook({
            dataset: vDatasetAddress,
            app: vDappAddress,
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
          .fetchDatasetOrderbook({
            dataset: vDatasetAddress,
            app: vDappWhitelistAddress,
            requester: requesterAddress,
          })
          .then((datasetOrderbook) => {
            const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
              (order) => order.order.datasetprice <= vDataMaxPrice
            );
            return desiredPriceDataOrderbook[0]?.order; // may be undefined
          }),
        // Fetch workerpool order for App or AppWhitelist
        Promise.all([
          // for app
          iexec.orderbook.fetchWorkerpoolOrderbook({
            workerpool: vWorkerpoolAddress,
            app: vDappAddress,
            dataset: vDatasetAddress,
            requester: requesterAddress,
            minTag: workerpoolMinTag,
            category: 0,
          }),
          // for app whitelist
          iexec.orderbook.fetchWorkerpoolOrderbook({
            workerpool: vWorkerpoolAddress,
            app: vDappWhitelistAddress,
            dataset: vDatasetAddress,
            requester: requesterAddress,
            minTag: workerpoolMinTag,
            category: 0,
          }),
        ]).then(
          ([workerpoolOrderbookForApp, workerpoolOrderbookForAppWhitelist]) => {
            const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
              workerpoolOrders: [
                ...workerpoolOrderbookForApp.orders,
                ...workerpoolOrderbookForAppWhitelist.orders,
              ],
              workerpoolMaxPrice: vWorkerpoolMaxPrice,
            });

            if (!desiredPriceWorkerpoolOrder) {
              throw new Error(
                'No Workerpool order found for the desired price'
              );
            }

            return desiredPriceWorkerpoolOrder;
          }
        ),
      ]);

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
        useCallback: true,
      })
    );

    const requestorderToSign = await iexec.order.createRequestorder({
      app: vDappAddress,
      category: workerpoolorder.category,
      dataset: vDatasetAddress,
      datasetmaxprice: datasetorder.datasetprice,
      appmaxprice: apporder.appprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      tag: ['tee'],
      workerpool: vWorkerpoolAddress,
      callback: CALLBACK_WEB3MAIL,
      params: {
        iexec_secrets: {
          1: requesterSecretId,
        },
        iexec_args: vLabel,
      },
    });

    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    // Match orders and compute task ID
    const { dealid: dealId } = await iexec.order.matchOrders({
      apporder: apporder,
      datasetorder: datasetorder,
      workerpoolorder: workerpoolorder,
      requestorder: requestorder,
    });

    const taskId = await iexec.deal.computeTaskId(dealId, 0);

    return {
      taskId,
      dealId,
    };
  } catch (error) {
    handleIfProtocolError(error);

    throw new WorkflowError({
      message: 'Failed to sendEmail',
      errorCause: error,
    });
  }
};
