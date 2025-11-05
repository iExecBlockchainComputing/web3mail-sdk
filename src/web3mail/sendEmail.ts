import { Buffer } from 'buffer';
import {
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import * as ipfs from '../utils/ipfs-service.js';
import { checkProtectedDataValidity } from '../utils/subgraphQuery.js';
import {
  addressOrEnsSchema,
  booleanSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  labelSchema,
  positiveNumberSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { SendEmailParams, SendEmailResponse } from './types.js';
import {
  DappAddressConsumer,
  DappWhitelistAddressConsumer,
  DataProtectorConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
  SubgraphConsumer,
} from './internalTypes.js';

export type SendEmail = typeof sendEmail;

export const sendEmail = async ({
  graphQLClient = throwIfMissing(),
  iexec = throwIfMissing(),
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
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
  grantedAccess,
  maxProtectedDataPerTask = 100,
  useVoucher = false,
}: IExecConsumer &
  SubgraphConsumer &
  DappAddressConsumer &
  DappWhitelistAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  SendEmailParams &
  DataProtectorConsumer): Promise<SendEmailResponse<SendEmailParams>> => {
  try {
    const vUseVoucher = booleanSchema()
      .label('useVoucher')
      .validateSync(useVoucher);
    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
      .required()
      .label('WorkerpoolAddressOrEns')
      .validateSync(workerpoolAddressOrEns);
    const vSenderName = senderNameSchema()
      .label('senderName')
      .validateSync(senderName);
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
    const vLabel = labelSchema().label('label').validateSync(label);

    const vDappAddressOrENS = addressOrEnsSchema()
      .required()
      .label('dappAddressOrENS')
      .validateSync(dappAddressOrENS);
    // TODO: remove this once we have a way to pass appWhitelist to processProtectedData function
    // const vDappWhitelistAddress = addressSchema()
    //   .required()
    //   .label('dappWhitelistAddress')
    //   .validateSync(dappWhitelistAddress);
    const vDataMaxPrice = positiveNumberSchema()
      .label('dataMaxPrice')
      .validateSync(dataMaxPrice);
    const vAppMaxPrice = positiveNumberSchema()
      .label('appMaxPrice')
      .validateSync(appMaxPrice);
    const vWorkerpoolMaxPrice = positiveNumberSchema()
      .label('workerpoolMaxPrice')
      .validateSync(workerpoolMaxPrice);

    // Encrypt email content
    const emailContentEncryptionKey = iexec.dataset.generateEncryptionKey();
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(vEmailContent, 'utf8'), emailContentEncryptionKey)
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to encrypt email content',
          errorCause: e,
        });
      });

    // Push email message to IPFS
    const cid = await ipfs
      .add(encryptedFile, {
        ipfsNode,
        ipfsGateway,
      })
      .catch((e) => {
        throw new WorkflowError({
          message: 'Failed to upload encrypted email content',
          errorCause: e,
        });
      });
    const multiaddr = `/ipfs/${cid}`;

    // Prepare secrets for the requester
    // Use a positive integer as secret ID (required by iexec)
    // Using "1" as a fixed ID for the requester secret
    const requesterSecretId = 1;
    const secrets = {
      [requesterSecretId]: JSON.stringify({
        senderName: vSenderName,
        emailSubject: vEmailSubject,
        emailContentMultiAddr: multiaddr,
        contentType: vContentType,
        emailContentEncryptionKey,
      }),
    };
    // Bulk processing
    if (grantedAccess) {
      const vMaxProtectedDataPerTask = positiveNumberSchema()
        .label('maxProtectedDataPerTask')
        .validateSync(maxProtectedDataPerTask);

      const bulkRequest = await dataProtector.prepareBulkRequest({
        app: vDappAddressOrENS,
        appMaxPrice: vAppMaxPrice,
        workerpoolMaxPrice: vWorkerpoolMaxPrice,
        workerpool: vWorkerpoolAddressOrEns,
        args: vLabel,
        inputFiles: [],
        secrets,
        bulkAccesses: grantedAccess,
        maxProtectedDataPerTask: vMaxProtectedDataPerTask,
      });
      const processBulkRequestResponse = await dataProtector.processBulkRequest(
        {
          bulkRequest: bulkRequest.bulkRequest,
          useVoucher: vUseVoucher,
          workerpool: vWorkerpoolAddressOrEns,
        }
      );
      return {
        tasks: processBulkRequestResponse.tasks.map((task) => ({
          taskId: task.taskId,
          dealId: task.dealId,
          bulkIndex: task.bulkIndex,
        })),
      } as unknown as SendEmailResponse<SendEmailParams>;
    }

    // Single processing mode - protectedData is required
    const vDatasetAddress = addressOrEnsSchema()
      .required()
      .label('protectedData')
      .validateSync(protectedData);
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

    // Use processProtectedData from dataprotector
    const result = await dataProtector.processProtectedData({
      defaultWorkerpool: vWorkerpoolAddressOrEns,
      protectedData: vDatasetAddress,
      app: vDappAddressOrENS,
      // userWhitelist: vDappWhitelistAddress, // Removed due to bug in dataprotector v2.0.0-beta.20
      dataMaxPrice: vDataMaxPrice,
      appMaxPrice: vAppMaxPrice,
      workerpoolMaxPrice: vWorkerpoolMaxPrice,
      workerpool: vWorkerpoolAddressOrEns,
      args: vLabel,
      inputFiles: [],
      secrets,
      useVoucher: vUseVoucher,
      waitForResult: false,
    });

    return {
      taskId: result.taskId,
    } as unknown as SendEmailResponse<SendEmailParams>;
  } catch (error) {
    //  Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }

    // Handle protocol errors - this will throw if it's an ApiCallError
    // handleIfProtocolError transforms ApiCallError into a WorkflowError with isProtocolError=true
    handleIfProtocolError(error);

    // If we reach here, it's not a protocol error
    // Check if it's a WorkflowError from processProtectedData by checking the message
    const isProcessProtectedDataError =
      error instanceof Error &&
      error.message === 'Failed to process protected data';

    if (isProcessProtectedDataError) {
      const cause = (error as any)?.cause;
      // Return unwrapped cause (the actual Error object)
      // error.cause should be an Error, but ensure it is
      const unwrappedCause = cause instanceof Error ? cause : error;
      throw new WorkflowError({
        message: 'Failed to sendEmail',
        errorCause: unwrappedCause,
      });
    }

    // For all other errors
    throw new WorkflowError({
      message: 'Failed to sendEmail',
      errorCause: error,
    });
  }
};
