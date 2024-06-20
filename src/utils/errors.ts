import {
  ApiCallError,
  BridgeError,
  ConfigurationError,
  IpfsGatewayCallError,
  MarketCallError,
  ObjectNotFoundError,
  ResultProxyCallError,
  SmsCallError,
  ValidationError,
  Web3ProviderCallError,
  Web3ProviderError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
  WorkerpoolCallError,
} from 'iexec/errors';
export class WorkflowError extends Error {
  originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
  }
}

export function handleProtocolError(error: Error): boolean {
  if (error instanceof ApiCallError) {
    throw new WorkflowError(
      'API call error occurred. Please check your API request and try again.',
      error
    );
  } else if (error instanceof BridgeError) {
    throw new WorkflowError(
      'Bridge error occurred. Please verify the bridge connection.',
      error
    );
  } else if (error instanceof ConfigurationError) {
    throw new WorkflowError(
      'Configuration error occurred. Please check your configuration settings.',
      error
    );
  } else if (error instanceof IpfsGatewayCallError) {
    throw new WorkflowError(
      'IPFS gateway call error occurred. Please check the IPFS gateway.',
      error
    );
  } else if (error instanceof MarketCallError) {
    throw new WorkflowError(
      'Market call error occurred. Please check the market service.',
      error
    );
  } else if (error instanceof ObjectNotFoundError) {
    throw new WorkflowError(
      'Object not found error occurred. The requested object could not be found.',
      error
    );
  } else if (error instanceof ResultProxyCallError) {
    throw new WorkflowError(
      'Result proxy call error occurred. Please check the result proxy service.',
      error
    );
  } else if (error instanceof SmsCallError) {
    throw new WorkflowError(
      'SMS call error occurred. Please check the SMS service.',
      error
    );
  } else if (error instanceof ValidationError) {
    throw new WorkflowError(
      'Validation error occurred. Please check the data you provided.',
      error
    );
  } else if (error instanceof Web3ProviderCallError) {
    throw new WorkflowError(
      'Web3 provider call error occurred. Please check the Web3 provider.',
      error
    );
  } else if (error instanceof Web3ProviderError) {
    throw new WorkflowError(
      'Web3 provider error occurred. Please check the Web3 provider.',
      error
    );
  } else if (error instanceof Web3ProviderSendError) {
    throw new WorkflowError(
      'Web3 provider send error occurred. Please check the Web3 provider.',
      error
    );
  } else if (error instanceof Web3ProviderSignMessageError) {
    throw new WorkflowError(
      'Web3 provider sign message error occurred. Please check the Web3 provider.',
      error
    );
  } else if (error instanceof WorkerpoolCallError) {
    throw new WorkflowError(
      'Workerpool call error occurred. Please check the workerpool service.',
      error
    );
  }

  return false;
}
