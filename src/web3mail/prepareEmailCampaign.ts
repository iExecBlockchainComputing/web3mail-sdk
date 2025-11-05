import { Buffer } from 'buffer';
import {
  DEFAULT_CONTENT_TYPE,
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
} from '../config/config.js';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import * as ipfs from '../utils/ipfs-service.js';
import {
  addressOrEnsSchema,
  contentTypeSchema,
  emailContentSchema,
  emailSubjectSchema,
  labelSchema,
  positiveNumberSchema,
  senderNameSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  PrepareEmailCampaignParams,
  PrepareEmailCampaignResponse,
} from './types.js';
import {
  DappAddressConsumer,
  DataProtectorConsumer,
  IExecConsumer,
  IpfsGatewayConfigConsumer,
  IpfsNodeConfigConsumer,
} from './internalTypes.js';

export type PrepareEmailCampaign = typeof prepareEmailCampaign;

export const prepareEmailCampaign = async ({
  iexec = throwIfMissing(),
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns,
  dappAddressOrENS,
  ipfsNode,
  ipfsGateway,
  senderName,
  emailSubject,
  emailContent,
  contentType = DEFAULT_CONTENT_TYPE,
  label,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  grantedAccess,
  maxProtectedDataPerTask,
}: IExecConsumer &
  DappAddressConsumer &
  IpfsNodeConfigConsumer &
  IpfsGatewayConfigConsumer &
  DataProtectorConsumer &
  PrepareEmailCampaignParams): Promise<PrepareEmailCampaignResponse> => {
  try {
    const vWorkerpoolAddressOrEns = addressOrEnsSchema()
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
      .label('contentType')
      .validateSync(contentType);

    const vLabel = labelSchema().label('label').validateSync(label);

    const vDappAddressOrENS = addressOrEnsSchema()
      .required()
      .label('dappAddressOrENS')
      .validateSync(dappAddressOrENS);

    const vAppMaxPrice = positiveNumberSchema()
      .label('appMaxPrice')
      .validateSync(appMaxPrice);

    const vWorkerpoolMaxPrice = positiveNumberSchema()
      .label('workerpoolMaxPrice')
      .validateSync(workerpoolMaxPrice);

    const vMaxProtectedDataPerTask = positiveNumberSchema()
      .label('maxProtectedDataPerTask')
      .validateSync(maxProtectedDataPerTask);

    // TODO: factor this
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

    // Push email content to IPFS
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
        emailSubject: vEmailSubject,
        emailContentMultiAddr: multiaddr,
        contentType: vContentType,
        senderName: vSenderName,
        emailContentEncryptionKey,
        useCallback: true,
      }),
    };

    // TODO: end factor this
    const { bulkRequest: campaignRequest } =
      await dataProtector.prepareBulkRequest({
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

    return { campaignRequest };
  } catch (error) {
    // Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }

    // Handle protocol errors - this will throw if it's an ApiCallError
    // handleIfProtocolError transforms ApiCallError into a WorkflowError with isProtocolError=true
    handleIfProtocolError(error);

    // For all other errors
    throw new WorkflowError({
      message: 'Failed to prepareEmailCampaign',
      errorCause: error,
    });
  }
};
