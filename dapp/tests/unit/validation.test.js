const {
  validateWorkerEnv,
  validateAppSecret,
  validateRequesterSecret,
  validateProtectedData,
} = require('../../src/validation');

describe('validateWorkerEnv function', () => {
  it('should not throw an error if all input values are valid', () => {
    expect(() =>
      validateWorkerEnv({
        IEXEC_OUT: '/path/to/iexec/out',
      })
    ).not.toThrow();
  });

  it('should throw an error if any required input is missing', () => {
    expect(() => validateWorkerEnv({})).toThrow(
      Error('Worker environment error: "IEXEC_OUT" is required')
    );
  });
});

describe('validateAppSecret function', () => {
  it('should not throw an error if all input values are valid', () => {
    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PUBLIC: 'api_public_key',
        MJ_APIKEY_PRIVATE: 'api_private_key',
        MJ_SENDER: 'sender@example.com',
        MAILGUN_APIKEY: 'mailgun_api_key',
      })
    ).not.toThrow();
  });

  it('should throw an error if any required input is missing', () => {
    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PRIVATE: 'api_private_key',
        MJ_SENDER: 'sender@example.com',
        MAILGUN_APIKEY: 'mailgun_api_key',
      })
    ).toThrow(/"MJ_APIKEY_PUBLIC" is required/i);

    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PUBLIC: 'api_public_key',
        MJ_SENDER: 'sender@example.com',
        MAILGUN_APIKEY: 'mailgun_api_key',
      })
    ).toThrow(/"MJ_APIKEY_PRIVATE" is required/i);

    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PUBLIC: 'api_public_key',
        MJ_APIKEY_PRIVATE: 'api_private_key',
        MAILGUN_APIKEY: 'mailgun_api_key',
      })
    ).toThrow(/"MJ_SENDER" is required/i);

    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PUBLIC: 'api_public_key',
        MJ_APIKEY_PRIVATE: 'api_private_key',
        MJ_SENDER: 'sender@example.com',
      })
    ).toThrow(/"MAILGUN_APIKEY" is required/i);
  });

  it('should include all validation errors in the thrown error message', () => {
    expect(() =>
      validateAppSecret({
        MJ_APIKEY_PUBLIC: 12345,
        MJ_APIKEY_PRIVATE: '',
        MJ_SENDER: 'foo',
        MAILGUN_APIKEY: '',
      })
    ).toThrow(
      Error(
        'App secret error: "MJ_APIKEY_PUBLIC" must be a string; "MJ_APIKEY_PRIVATE" is not allowed to be empty; "MJ_SENDER" must be a valid email; "MAILGUN_APIKEY" is not allowed to be empty'
      )
    );
  });
});

describe('validateRequesterSecret function', () => {
  let testedObj;

  beforeEach(() => {
    testedObj = {
      emailSubject: 'Test email',
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      emailContentEncryptionKey: 'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      contentType: 'text/plain',
      senderName: 'sender test name',
    };
  });

  it('should not throw an error if all input values are valid', () => {
    expect(() => validateRequesterSecret(testedObj)).not.toThrow();
  });

  it('should accept valid contentType', () => {
    const res = validateRequesterSecret({
      ...testedObj,
      contentType: 'text/html',
    });
    expect(res.contentType).toStrictEqual('text/html');
  });

  it('should accept valid senderName', () => {
    const res = validateRequesterSecret({
      ...testedObj,
      senderName: 'Product Team',
    });
    expect(res.senderName).toStrictEqual('Product Team');
  });

  it('should accept an undefined senderName', () => {
    const res = validateRequesterSecret({
      ...testedObj,
      senderName: undefined,
    });
    expect(res.senderName === undefined);
  });

  it('should throw an error if contentType is invalid', () => {
    expect(() =>
      validateRequesterSecret({ ...testedObj, contentType: 'foo' })
    ).toThrow(
      Error(
        'Requester secret error: "contentType" must be one of [text/plain, text/html]'
      )
    );
  });

  it('should throw an error if the emailContentMultiAddr value is not a valid multiAddr', () => {
    testedObj.emailContentMultiAddr = 'not a multiAddr';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      Error(
        'Requester secret error: "emailContentMultiAddr" must be a multiAddr'
      )
    );
  });
  it('should throw an error if the emailContentEncryptionKey value is not a valid base64 string', () => {
    testedObj.emailContentEncryptionKey = 'email content';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      Error(
        'Requester secret error: "emailContentEncryptionKey" must be a valid base64 string'
      )
    );
  });

  it('should include all validation errors in the thrown error message', () => {
    testedObj.contentType = 'bar';
    testedObj.mailJetApiKeyPublic = 12345;
    testedObj.emailContentMultiAddr = '';
    expect(() => validateRequesterSecret(testedObj)).toThrow(
      Error(
        'Requester secret error: "emailContentMultiAddr" is not allowed to be empty; "contentType" must be one of [text/plain, text/html]; "mailJetApiKeyPublic" is not allowed'
      )
    );
  });
});

describe('validateProtectedData function', () => {
  it('should not throw an error if all input values are valid', () => {
    expect(() =>
      validateProtectedData({
        email: 'foo+bar@bar.com',
      })
    ).not.toThrow();
  });

  it('should not throw an error if all input values are valid', () => {
    const res = validateProtectedData({
      email: 'foo+bar@bar.com', // accepts "+" aliases
    });
    expect(res).toStrictEqual({ email: 'foo+bar@bar.com' });
  });

  it('should throw an error if any required input is missing', () => {
    expect(() => validateProtectedData({})).toThrow(
      Error('ProtectedData error: "email" is required')
    );
  });

  it('should throw an error if email is not an email', () => {
    expect(() =>
      validateProtectedData({
        email: 'fooatbardotcom',
      })
    ).toThrow(Error('ProtectedData error: "email" must be a valid email'));
  });
});
