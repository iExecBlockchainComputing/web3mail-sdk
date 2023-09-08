const validateInputs = require('../../src/validateInputs');
const Joi = require('joi');

describe('validateInputs function', () => {
  let envVars;

  beforeEach(() => {
    envVars = {
      iexecIn: '/path/to/iexec/in',
      iexecOut: '/path/to/iexec/out',
      dataFileName: 'data.txt',
      mailJetApiKeyPublic: 'api_public_key',
      mailJetApiKeyPrivate: 'api_private_key',
      mailJetSender: 'sender@example.com',
      emailSubject: 'Test email',
      emailContentOrMultiAddr: 'This is a it email',
      emailContentEncryptionKey: 'iqEsUnNxTPwR08MTFRgK+/tG6ErTUCs3Sx/tNuMIg2I=',
      contentType: 'text/plain',
      senderName: 'sender test name',
    };
  });

  it('should not throw an error if all input values are valid', () => {
    expect(() => validateInputs(envVars)).not.toThrow();
  });

  it('should accept valid contentType', () => {
    const res = validateInputs({
      ...envVars,
      contentType: 'text/html',
    });
    expect(res.contentType).toStrictEqual('text/html');
  });

  it('should accept valid senderName', () => {
    const res = validateInputs({
      ...envVars,
      senderName: 'Product Team',
    });
    expect(res.senderName).toStrictEqual('Product Team');
  });

  it('should accept an undefined senderName', () => {
    const res = validateInputs({
      ...envVars,
      senderName: undefined,
    });
    expect(res.senderName === undefined);
  });

  it('should throw an error if contentType is invalid', () => {
    expect(() => validateInputs({ ...envVars, contentType: 'foo' })).toThrow(
      Error('"contentType" must be one of [text/plain, text/html]')
    );
  });

  it('should throw an error if any required input is missing', () => {
    delete envVars.iexecIn;
    expect(() => validateInputs(envVars)).toThrow(/"iexecIn" is required/i);
  });

  it('should throw an error if any input value is of an invalid type', () => {
    envVars.iexecIn = 12345;
    expect(() => validateInputs(envVars)).toThrow(
      /"iexecIn" must be a string/i
    );
  });

  it('should throw an error if the mailJetSender value is not a valid email address', () => {
    envVars.mailJetSender = 'not_an_email';
    expect(() => validateInputs(envVars)).toThrow(
      /"mailJetSender" must be a valid email/i
    );
  });

  it('should include all validation errors in the thrown error message', () => {
    delete envVars.iexecOut;
    envVars.mailJetApiKeyPublic = 12345;
    envVars.emailContentOrMultiAddr = '';
    expect(() => validateInputs(envVars)).toThrow(
      /"iexecOut" is required; "mailJetApiKeyPublic" must be a string; "emailContentOrMultiAddr\" is not allowed to be empty/i
    );
  });
});
