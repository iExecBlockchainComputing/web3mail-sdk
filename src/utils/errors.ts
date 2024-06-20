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
    console.log(
      'API call error occurred. Please check your API request and try again.'
    );
    return true;
  } else if (error instanceof BridgeError) {
    console.log('Bridge error occurred. Please verify the bridge connection.');
    return true;
  } else if (error instanceof ConfigurationError) {
    console.log(
      'Configuration error occurred. Please check your configuration settings.'
    );
    return true;
  } else if (error instanceof IpfsGatewayCallError) {
    console.log(
      'IPFS gateway call error occurred. Please check the IPFS gateway.'
    );
    return true;
  } else if (error instanceof MarketCallError) {
    console.log('Market call error occurred. Please check the market service.');
    return true;
  } else if (error instanceof ObjectNotFoundError) {
    console.log(
      'Object not found error occurred. The requested object could not be found.'
    );
    return true;
  } else if (error instanceof ResultProxyCallError) {
    console.log(
      'Result proxy call error occurred. Please check the result proxy service.'
    );
    return true;
  } else if (error instanceof SmsCallError) {
    console.log('SMS call error occurred. Please check the SMS service.');
    return true;
  } else if (error instanceof ValidationError) {
    console.log(
      'Validation error occurred. Please check the data you provided.'
    );
    return true;
  } else if (error instanceof Web3ProviderCallError) {
    console.log(
      'Web3 provider call error occurred. Please check the Web3 provider.'
    );
    return true;
  } else if (error instanceof Web3ProviderError) {
    console.log(
      'Web3 provider error occurred. Please check the Web3 provider.'
    );
    return true;
  } else if (error instanceof Web3ProviderSendError) {
    console.log(
      'Web3 provider send error occurred. Please check the Web3 provider.'
    );
    return true;
  } else if (error instanceof Web3ProviderSignMessageError) {
    console.log(
      'Web3 provider sign message error occurred. Please check the Web3 provider.'
    );
    return true;
  } else if (error instanceof WorkerpoolCallError) {
    console.log(
      'Workerpool call error occurred. Please check the workerpool service.'
    );
    return true;
  }

  return false;
}
