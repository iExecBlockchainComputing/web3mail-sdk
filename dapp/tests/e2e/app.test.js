const path = require('path');
const fsPromises = require('fs').promises;
const start = require('../../src/sendEmail');

describe('sendEmail', () => {
  beforeEach(() => {
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    process.env.IEXEC_DATASET_FILENAME = 'data.zip';
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      MJ_APIKEY_PUBLIC: 'xxx',
      MJ_APIKEY_PRIVATE: 'xxx',
      MJ_SENDER: 'foo@bar.com',
    });
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      emailContentEncryptionKey: 'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
      emailSubject: 'email_subject',
    });
  });

  it('should fail if developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = '';
    await expect(() => start()).rejects.toThrow(
      Error('Failed to parse the developer secret')
    );
  });
  it('should fail if MJ_APIKEY_PUBLIC in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      MJ_APIKEY_PRIVATE: 'xxx',
      MJ_SENDER: 'foo@bar.com',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetApiKeyPublic" is required')
    );
  });
  it('should fail if MJ_APIKEY_PRIVATE in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      MJ_APIKEY_PUBLIC: 'xxx',
      MJ_SENDER: 'foo@bar.com',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetApiKeyPrivate" is required')
    );
  });
  it('should fail if MJ_SENDER in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      MJ_APIKEY_PUBLIC: 'xxx',
      MJ_APIKEY_PRIVATE: 'xxx',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetSender" is required')
    );
  });
  it('should fail if emailSubject is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      emailSubject: '',
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"emailSubject" is not allowed to be empty')
    );
  });
  it('should fail if emailContentMultiAddr is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      emailContentMultiAddr: '',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"emailContentMultiAddr" is not allowed to be empty')
    );
  });
  it('should fail if emailContentMultiAddr is no an ipfs multiaddr', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      emailContentMultiAddr: 'foo',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"emailContentMultiAddr" must be a multiAddr')
    );
  });
  it('should fail if IEXEC_REQUESTER_SECRET_1 is not a JSON', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = '_';
    await expect(() => start()).rejects.toThrow(
      Error('Failed to parse requester secret')
    );
  });
  it('should fail if contentType contains invalid content-type', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      contentType: 'notacontenttype',
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"contentType" must be one of [text/plain, text/html]')
    );
  });
  it('should fail if senderName is empty', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: '',
      emailContentMultiAddr:
        '/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"senderName" is not allowed to be empty')
    );
  });
  it('should fail if senderName length is less than 3 characters', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: 'AB',
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error('"senderName" length must be at least 3 characters long')
    );
  });
  it('should fail if senderName length is more than 20 characters', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
      senderName: 'A very long sender tag may be flagged as spam',
      emailContentMultiAddr:
        '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
      emailSubject: 'email_subject',
    });
    await expect(() => start()).rejects.toThrow(
      Error(
        '"senderName" length must be less than or equal to 20 characters long'
      )
    );
  });
  it('should fail if email service fail to send the email', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
      MJ_APIKEY_PUBLIC: 'xxx',
      MJ_APIKEY_PRIVATE: 'xxx',
      MJ_SENDER: 'foo@bar.com',
    });
    await expect(() => start()).rejects.toThrow(Error('Failed to send email'));
  });

  if (
    process.env.DRONE &&
    process.env.MJ_APIKEY_PUBLIC &&
    process.env.MJ_APIKEY_PRIVATE &&
    process.env.MJ_SENDER
  ) {
    it('should send an email successfully', async () => {
      // clean IEXEC_OUT
      await fsPromises
        .rm(process.env.IEXEC_OUT, { recursive: true })
        .catch(() => {});
      await fsPromises.mkdir(process.env.IEXEC_OUT, { recursive: true });

      // developer secret setup
      const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER } = process.env;
      process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
        MJ_APIKEY_PUBLIC,
        MJ_APIKEY_PRIVATE,
        MJ_SENDER,
      });

      // requester secret setup
      process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
        emailSubject: `web3mail test ${process.env.DRONE_COMMIT}`,
        emailContentMultiAddr:
          '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
        emailContentEncryptionKey:
          'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
        senderName: 'e2e test',
        contentType: 'text/plain',
      });

      await expect(start()).resolves.toBeUndefined();
      const { IEXEC_OUT } = process.env;
      const resultTxt = await fsPromises.readFile(
        path.join(IEXEC_OUT, 'result.txt'),
        'utf-8'
      );
      const computedJson = await fsPromises.readFile(
        path.join(IEXEC_OUT, 'computed.json'),
        'utf-8'
      );
      expect(JSON.parse(resultTxt)).toStrictEqual({
        message: 'Your email has been sent successfully.',
        status: 200,
      });
      expect(JSON.parse(computedJson)).toStrictEqual({
        'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      });
    });
  }
});
