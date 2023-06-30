const path = require('path');
const fsPromises = require('fs').promises;
const start = require('../../src/sendEmail');

describe('sendEmail', () => {
  beforeEach(() => {
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    process.env.IEXEC_DATASET_FILENAME = 'data.zip';
    process.env.IEXEC_APP_DEVELOPER_SECRET =
      '{"MJ_APIKEY_PUBLIC":"xxx","MJ_APIKEY_PRIVATE":"xxx","MJ_SENDER":"foo@bar.com"}';
    process.env.IEXEC_REQUESTER_SECRET_1 = 'web3mail test email';
    process.env.IEXEC_REQUESTER_SECRET_2 = 'web3mail email content';
    process.env.IEXEC_REQUESTER_SECRET_3 = ''; // options
  });

  it('should fail if developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET = '';
    await expect(() => start()).rejects.toThrow(
      Error('Failed to parse the developer secret')
    );
  });
  it('should fail if MJ_APIKEY_PUBLIC in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET =
      '{"MJ_APIKEY_PRIVATE":"xxx","MJ_SENDER":"foo@bar.com"}';
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetApiKeyPublic" is required')
    );
  });
  it('should fail if MJ_APIKEY_PRIVATE in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET =
      '{"MJ_APIKEY_PUBLIC":"xxx","MJ_SENDER":"foo@bar.com"}';
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetApiKeyPrivate" is required')
    );
  });
  it('should fail if MJ_SENDER in developer secret is missing', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET =
      '{"MJ_APIKEY_PUBLIC":"xxx","MJ_APIKEY_PRIVATE":"xxx"}';
    await expect(() => start()).rejects.toThrow(
      Error('"mailJetSender" is required')
    );
  });
  it('should fail if IEXEC_REQUESTER_SECRET_1 (emailSubject) is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = '';
    await expect(() => start()).rejects.toThrow(
      Error('"emailSubject" is not allowed to be empty')
    );
  });
  it('should fail if IEXEC_REQUESTER_SECRET_2 (emailContent) is missing', async () => {
    process.env.IEXEC_REQUESTER_SECRET_1 = '';
    await expect(() => start()).rejects.toThrow(
      Error('"emailSubject" is not allowed to be empty')
    );
  });
  it('should fail if IEXEC_REQUESTER_SECRET_3 (options) is not a JSON', async () => {
    process.env.IEXEC_REQUESTER_SECRET_3 = '_';
    await expect(() => start()).rejects.toThrow(
      Error('Failed to parse options from requester secret')
    );
  });
  it('should fail if IEXEC_REQUESTER_SECRET_3 (options) contains invalid value', async () => {
    process.env.IEXEC_REQUESTER_SECRET_3 = '{"foo"}';
    await expect(() => start()).rejects.toThrow(
      Error('Failed to parse options from requester secret')
    );
  });
  it('should fail if email service fail to send the email', async () => {
    process.env.IEXEC_APP_DEVELOPER_SECRET =
      '{"MJ_APIKEY_PUBLIC":"xxx","MJ_APIKEY_PRIVATE":"xxx","MJ_SENDER":"foo@bar.com"}';
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
      process.env.IEXEC_REQUESTER_SECRET_1 = `web3mail test ${process.env.DRONE_COMMIT}`;
      process.env.IEXEC_REQUESTER_SECRET_2 = `Hey!<br/>tests are running on <a href="${process.env.DRONE_REPO_LINK}/commit/${process.env.DRONE_COMMIT}">${process.env.DRONE_REPO}</a>`;
      process.env.IEXEC_REQUESTER_SECRET_3 = JSON.stringify({
        contentType: 'text/html',
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
