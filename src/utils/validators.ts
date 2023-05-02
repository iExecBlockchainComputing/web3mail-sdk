import { ValidationError } from 'yup';

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};
