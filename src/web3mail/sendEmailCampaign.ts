import { NULL_ADDRESS } from 'iexec/utils';
import { ValidationError } from 'yup';
import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import {
  addressSchema,
  campaignRequestSchema,
  throwIfMissing,
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
  workerpoolAddress = throwIfMissing(),
  campaignRequest,
}: DataProtectorConsumer &
  SendEmailCampaignParams): Promise<SendEmailCampaignResponse> => {
  const vCampaignRequest = campaignRequestSchema()
    .required()
    .label('campaignRequest')
    .validateSync(campaignRequest) as CampaignRequest;

  const vWorkerpoolAddress = addressSchema()
    .required()
    .label('workerpoolAddress')
    .validateSync(workerpoolAddress);

  if (
    vCampaignRequest.workerpool !== NULL_ADDRESS &&
    vCampaignRequest.workerpool.toLowerCase() !==
      vWorkerpoolAddress.toLowerCase()
  ) {
    throw new ValidationError(
      "workerpoolAddress doesn't match campaignRequest workerpool"
    );
  }

  try {
    // Process the prepared bulk request
    const processBulkRequestResponse = await dataProtector.processBulkRequest({
      bulkRequest: vCampaignRequest,
      workerpool: vWorkerpoolAddress,
      waitForResult: false,
    });

    return processBulkRequestResponse;
  } catch (error) {
    // Protocol error detected, re-throwing as-is
    if ((error as any)?.isProtocolError === true) {
      throw error;
    }

    // Handle protocol errors - this will throw if it's an ApiCallError
    handleIfProtocolError(error as Error);

    // For all other errors
    throw new WorkflowError({
      message: 'Failed to sendEmailCampaign',
      errorCause: error as Error,
    });
  }
};
