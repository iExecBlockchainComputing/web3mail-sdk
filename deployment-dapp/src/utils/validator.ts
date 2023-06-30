import { number, string } from 'yup';

export const positiveNumberSchema = () => number().min(0);
export const positiveStrictIntegerSchema = () => number().integer().positive();

export const orderHashSchema = () =>
  string()
    .matches(
      /^0x[a-fA-F0-9]{64}$/,
      'Invalid input: The string must be a 64-character hexadecimal string prefixed with 0x.'
    )
    .required('Input is required');
