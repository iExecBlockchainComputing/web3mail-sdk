import { NULL_ADDRESS } from 'iexec/utils';
import { ValidationError } from 'yup';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsSchema,
  campaignRequestSchema,
  throwIfMissing,
  booleanSchema,
} from '../utils/validators.js';
import {
  CampaignRequest,
  SendEmailCampaignParams,
  SendEmailCampaignResponse,
} from './types.js';
import { DataProtectorConsumer } from './internalTypes.js';

export type SendEmailCampaign = typeof sendEmailCampaign;

export const sendEmailCampaign = async ({
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  campaignRequest,
  allowDeposit = false,
}: DataProtectorConsumer &
  SendEmailCampaignParams): Promise<SendEmailCampaignResponse> => {
  const vCampaignRequest = campaignRequestSchema()
    .required()
    .label('campaignRequest')
    .validateSync(campaignRequest) as CampaignRequest;

  const vWorkerpoolAddressOrEns = addressOrEnsSchema()
    .required()
    .label('workerpoolAddressOrEns')
    .validateSync(workerpoolAddressOrEns);

  const vAllowDeposit = booleanSchema()
    .label('allowDeposit')
    .validateSync(allowDeposit);

  if (
    vCampaignRequest.workerpool !== NULL_ADDRESS &&
    vCampaignRequest.workerpool.toLowerCase() !==
      vWorkerpoolAddressOrEns.toLowerCase()
  ) {
    throw new ValidationError(
      "workerpoolAddressOrEns doesn't match campaignRequest workerpool"
    );
  }

  try {
    // Process the prepared bulk request
    // TODO: Remove @ts-ignore once @iexec/dataprotector is updated to a version that includes allowDeposit in ProcessBulkRequestParams types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - allowDeposit is supported at runtime but not yet in TypeScript types
    const processBulkRequestResponse = await dataProtector.processBulkRequest({
      bulkRequest: vCampaignRequest,
      workerpool: vWorkerpoolAddressOrEns,
      waitForResult: false,
      allowDeposit: vAllowDeposit,
    });

    return processBulkRequestResponse;
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
      message: 'Failed to sendEmailCampaign',
      errorCause: error,
    });
  }
};
