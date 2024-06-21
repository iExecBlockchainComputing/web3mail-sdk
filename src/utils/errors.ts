import { ApiCallError } from 'iexec/errors';
export class WorkflowError extends Error {
  constructor(message: string, originalError: Error) {
    super(message, { cause: originalError });
    this.name = this.constructor.name;
  }
}

export function handleProtocolError(error: Error): boolean {
  if (error instanceof ApiCallError) {
    throw new WorkflowError(
      'A service in the iExec protocol appears to be unavailable. This issue is not caused by your actions:',
      error
    );
  }
  return false;
}
