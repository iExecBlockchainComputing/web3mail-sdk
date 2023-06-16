import { string } from 'yup';

export const params = () =>
  string().test(
    'numeric',
    'Price must be a string that represents a number.',
    (value) => {
      const isNumeric = /^-?\d+(\.\d+)?$/.test(value);
      return isNumeric || isUndefined(value);
    }
  );

export const isUndefined = (value: any) => value === undefined;
