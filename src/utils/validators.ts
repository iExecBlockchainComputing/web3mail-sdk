import { utils } from 'ethers';
import { ValidationError, string } from 'yup';

const { isAddress } = utils;

export const throwIfMissing = (): never => {
  throw new ValidationError('Missing parameter');
};

const isUndefined = (value: any) => value === undefined;
const isAddressTest = (value: string) => isAddress(value);
const isEnsTest = (value: string) => value.endsWith('.eth') && value.length > 6;

export const addressOrEnsSchema = () =>
  string()
    .transform((value: string) => value?.toLowerCase() || value)
    .test(
      'is-address-or-ens',
      '${path} should be an ethereum address or a ENS name',
      (value) => isUndefined(value) || isAddressTest(value) || isEnsTest(value)
    );

// 78 char length for email subject (rfc2822)
export const emailSubjectSchema = () => string().max(78).strict();

// 4096 bytes is the current max length for iExec SMS secrets
export const emailContentSchema = () => string().max(4096).strict();

// Valid content types for the variable 'contentType'
const validContentTypes = ['text/plain', 'text/html'];

export const contentTypeSchema = () =>
  string().oneOf(validContentTypes, 'Invalid contentType').optional();

// Minimum of 3 characters and max of 20 to avoid sender being flagged as spam
export const senderNameSchema = () => string().min(3).max(20).optional();
