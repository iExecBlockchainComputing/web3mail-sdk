import { handleIfProtocolError, WorkflowError } from '../utils/errors.js';
import { addressOrEnsSchema, throwIfMissing } from '../utils/validators.js';
import { SendEmailCampaignParams, SendEmailCampaignResponse } from './types.js';
import { DataProtectorConsumer } from './internalTypes.js';

export type SendEmailCampaign = typeof sendEmailCampaign;

export const sendEmailCampaign = async ({
  dataProtector = throwIfMissing(),
  workerpoolAddressOrEns = throwIfMissing(),
  campaignRequest,
}: DataProtectorConsumer &
  SendEmailCampaignParams): Promise<SendEmailCampaignResponse> => {
  const vWorkerpoolAddressOrEns = addressOrEnsSchema()
    .required()
    .label('workerpoolAddressOrEns')
    .validateSync(workerpoolAddressOrEns);
  if (
    campaignRequest?.workerpool !== NULL_ADDRESS &&
    vWorkerpoolAddressOrEns.toLowerCase() !==
      campaignRequest.workerpool.toLowerCase()
  ) {
    throw new ValidationError(
      "workerpoolAddressOrEns doesn't match campaignRequest workerpool"
    );
  }

  try {
    // Process the prepared bulk request
    const processBulkRequestResponse: SendEmailCampaignResponse =
      await dataProtector.processBulkRequest({
        bulkRequest: campaignRequest,
        workerpool: vWorkerpoolAddressOrEns,
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
