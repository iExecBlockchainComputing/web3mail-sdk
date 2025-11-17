const path = require('path');
const fsPromises = require('fs').promises;
const start = require('../../src/executeTask');

async function readOutputs(outputDir) {
  const [result, computed, files] = await Promise.all([
    fsPromises
      .readFile(path.join(outputDir, 'result.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => null),
    fsPromises
      .readFile(path.join(outputDir, 'computed.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => null),
    fsPromises.readdir(outputDir).catch(() => []),
  ]);
  return {
    result,
    computed,
    files,
  };
}

async function cleanOutputs(outputDir) {
  await fsPromises.rm(outputDir, { recursive: true }).catch(() => {});
  await fsPromises.mkdir(outputDir, { recursive: true });
}

describe('sendEmail', () => {
  beforeEach(async () => {
    // worker env setup
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    // clean IEXEC_OUT
    await cleanOutputs(process.env.IEXEC_OUT);
  });

  describe('without credentials', () => {
    beforeEach(() => {
      // protected data setup
      process.env.IEXEC_DATASET_FILENAME = 'data.zip';
      // app secret setup
      process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
        MJ_APIKEY_PUBLIC: 'xxx',
        MJ_APIKEY_PRIVATE: 'xxx',
        MJ_SENDER: 'foo@bar.com',
        MAILGUN_APIKEY: 'xxx',
        WEB3MAIL_WHITELISTED_APPS:
          '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
        POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
      });
      // requester secret setup
      process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
        emailContentMultiAddr:
          '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
        emailContentEncryptionKey:
          'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
        emailSubject: 'email_subject',
      });
    });

    describe('with bad IEXEC_APP_DEVELOPER_SECRET', () => {
      it('should fail if developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = '';

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'Failed to parse the developer secret',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if MJ_APIKEY_PUBLIC in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PRIVATE: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          MAILGUN_APIKEY: 'xxx',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "MJ_APIKEY_PUBLIC" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if MJ_APIKEY_PRIVATE in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          MAILGUN_APIKEY: 'xxx',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "MJ_APIKEY_PRIVATE" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if MJ_SENDER in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MAILGUN_APIKEY: 'xxx',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "MJ_SENDER" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if MAILGUN_APIKEY in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "MAILGUN_APIKEY" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if WEB3MAIL_WHITELISTED_APPS in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MAILGUN_APIKEY: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "WEB3MAIL_WHITELISTED_APPS" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if POCO_SUBGRAPH_URL in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MAILGUN_APIKEY: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'App secret error: "POCO_SUBGRAPH_URL" is required',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
    });

    describe('with bad IEXEC_REQUESTER_SECRET_1', () => {
      it('should fail if IEXEC_REQUESTER_SECRET_1 is not a JSON', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = '_';

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'Failed to parse requester secret',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if emailSubject is missing', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailSubject: '',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "emailSubject" is not allowed to be empty',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if emailContentMultiAddr is missing', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailContentMultiAddr: '',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "emailContentMultiAddr" is not allowed to be empty',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if emailContentMultiAddr is no an ipfs multiaddr', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailContentMultiAddr: 'foo',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "emailContentMultiAddr" must be a multiAddr',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if contentType contains invalid content-type', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          contentType: 'notacontenttype',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "contentType" must be one of [text/plain, text/html]',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if senderName is empty', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          senderName: '',
          emailContentMultiAddr:
            '/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "senderName" is not allowed to be empty',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if senderName length is less than 3 characters', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          senderName: 'AB',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "senderName" length must be at least 3 characters long',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
      it('should fail if senderName length is more than 20 characters', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          senderName: 'A very long sender tag may be flagged as spam',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailSubject: 'email_subject',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Requester secret error: "senderName" length must be less than or equal to 20 characters long',
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
    });

    describe('with bad protectedData', () => {
      it('should fail if the dataset is not a protectedData', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'invalidZipFile.txt';

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error:
            'Failed to parse ProtectedData 0: Failed to load protected data',
          protectedData: process.env.IEXEC_DATASET_FILENAME,
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });

      it('should fail if protectedData has no "email" key', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'dataNoEmail.zip';

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'Failed to parse ProtectedData 0: Failed to load path email',
          protectedData: process.env.IEXEC_DATASET_FILENAME,
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });

      it('should fail if protectedData "email" key is not an email', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'dataInvalidEmail.zip';
        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'ProtectedData error: "email" must be a valid email',
          protectedData: process.env.IEXEC_DATASET_FILENAME,
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
    });

    describe('when mailgun is unreachable', () => {
      it('should skip mailgun address validation', async () => {
        // this data does not pass validation
        process.env.IEXEC_DATASET_FILENAME = 'dataEmailUserDoesNotExist.zip';
        // mailgun api key is fake
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          MAILGUN_APIKEY: 'fake',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });
        // check the error is not an email validation error (mailgun validation is skipped, mailjet rejects)
        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'Failed to send email',
          protectedData: process.env.IEXEC_DATASET_FILENAME,
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
    });

    describe('when mailjet answers with error', () => {
      it('should output an error if email service fail to send the email', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          MAILGUN_APIKEY: 'xxx',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });

        await expect(start()).resolves.toBeUndefined();

        const { result, computed, files } = await readOutputs(
          process.env.IEXEC_OUT
        );
        expect(result).toStrictEqual({
          success: false,
          error: 'Failed to send email',
          protectedData: process.env.IEXEC_DATASET_FILENAME,
        });
        expect(computed).toStrictEqual({
          'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
        });
        expect(files.length).toBe(2);
      });
    });
  });

  if (
    // runs in CI with services credentials
    process.env.GITHUB_ACTIONS ||
    // or locally when all credentials are set
    (process.env.MJ_APIKEY_PUBLIC &&
      process.env.MJ_APIKEY_PRIVATE &&
      process.env.MJ_SENDER &&
      process.env.MAILGUN_APIKEY &&
      process.env.POCO_SUBGRAPH_URL)
  ) {
    describe('with credentials', () => {
      beforeEach(() => {
        // developer secret setup
        const {
          MJ_APIKEY_PUBLIC,
          MJ_APIKEY_PRIVATE,
          MJ_SENDER,
          MAILGUN_APIKEY,
          WEB3MAIL_WHITELISTED_APPS,
          POCO_SUBGRAPH_URL,
        } = process.env;
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC,
          MJ_APIKEY_PRIVATE,
          MJ_SENDER,
          MAILGUN_APIKEY,
          WEB3MAIL_WHITELISTED_APPS,
          POCO_SUBGRAPH_URL,
        });

        // requester secret setup
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailSubject: `web3mail test ${process.env.GITHUB_SHA}`,
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailContentEncryptionKey:
            'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
          senderName: 'e2e test',
          contentType: 'text/plain',
        });
      });

      describe('with valid email protectedData', () => {
        it('should send an email successfully', async () => {
          // protected data setup
          process.env.IEXEC_DATASET_FILENAME = 'data.zip';

          await expect(start()).resolves.toBeUndefined();

          const { result, computed, files } = await readOutputs(
            process.env.IEXEC_OUT
          );
          expect(result).toStrictEqual({
            success: true,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
          });
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
          });
          expect(files.length).toBe(2);
        });

        it('should send an email successfully and set the valid email callback when requested', async () => {
          // protected data setup
          process.env.IEXEC_DATASET_FILENAME = 'data.zip';
          process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
            ...JSON.parse(process.env.IEXEC_REQUESTER_SECRET_1),
            useCallback: true,
          });

          await expect(start()).resolves.toBeUndefined();

          const { result, computed, files } = await readOutputs(
            process.env.IEXEC_OUT
          );
          expect(result).toStrictEqual({
            success: true,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
          });
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
            'callback-data':
              '0x0000000000000000000000000000000000000000000000000000000000000003',
          });
          expect(files.length).toBe(2);
        });
      });

      describe('with invalid email protectedData', () => {
        it('should output an error if email address does not exist', async () => {
          // protected data setup
          process.env.IEXEC_DATASET_FILENAME = 'dataEmailUserDoesNotExist.zip';

          await expect(start()).resolves.toBeUndefined();

          const { result, computed, files } = await readOutputs(
            process.env.IEXEC_OUT
          );
          expect(result).toStrictEqual({
            success: false,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
            error: 'The protected email address seems to be invalid.',
          });
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
          });
          expect(files.length).toBe(2);
        });

        it('should output an error if email address is disposable', async () => {
          // protected data setup
          process.env.IEXEC_DATASET_FILENAME = 'dataDisposableEmail.zip';

          await expect(start()).resolves.toBeUndefined();

          const { result, computed, files } = await readOutputs(
            process.env.IEXEC_OUT
          );
          expect(result).toStrictEqual({
            success: false,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
            error: 'The protected email address seems to be invalid.',
          });
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
          });
          expect(files.length).toBe(2);
        });

        it('should set the invalid email callback when requested', async () => {
          // protected data setup
          process.env.IEXEC_DATASET_FILENAME = 'dataEmailUserDoesNotExist.zip';

          await expect(start()).resolves.toBeUndefined();

          const { result, computed, files } = await readOutputs(
            process.env.IEXEC_OUT
          );
          expect(result).toStrictEqual({
            success: false,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
            error: 'The protected email address seems to be invalid.',
          });
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
            'callback-data':
              '0x0000000000000000000000000000000000000000000000000000000000000002',
          });
          expect(files.length).toBe(2);
        });
      });
    });
  }

  describe('bulk processing', () => {
    beforeEach(() => {
      // app secret setup
      process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
        MJ_APIKEY_PUBLIC: 'xxx',
        MJ_APIKEY_PRIVATE: 'xxx',
        MJ_SENDER: 'foo@bar.com',
        MAILGUN_APIKEY: 'xxx',
        WEB3MAIL_WHITELISTED_APPS:
          '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
        POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
      });

      // requester secret setup
      process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
        emailContentMultiAddr:
          '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
        emailContentEncryptionKey:
          'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
        emailSubject: 'email_subject',
      });
    });

    it('should process multiple datasets in bulk mode', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '2';
      process.env.IEXEC_DATASET_1_FILENAME = 'data.zip';
      process.env.IEXEC_DATASET_2_FILENAME = 'data.zip';

      await expect(start()).resolves.toBeUndefined();

      const { result, computed, files } = await readOutputs(
        process.env.IEXEC_OUT
      );
      expect(result).toStrictEqual({
        success: false,
        error: 'Partial failure',
        errorCount: 2,
        successCount: 0,
        totalCount: 2,
        results: [
          {
            index: 1,
            protectedData: process.env.IEXEC_DATASET_1_FILENAME,
            success: false,
            error: 'Failed to send email',
          },
          {
            index: 2,
            protectedData: process.env.IEXEC_DATASET_2_FILENAME,
            success: false,
            error: 'Failed to send email',
          },
        ],
      });
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
      });
      expect(files.length).toBe(2);
    });

    it('should handle mixed valid and invalid datasets', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '2';
      process.env.IEXEC_DATASET_1_FILENAME = 'data.zip';
      process.env.IEXEC_DATASET_2_FILENAME = 'dataInvalidEmail.zip';

      await expect(start()).resolves.toBeUndefined();

      const { result, computed, files } = await readOutputs(
        process.env.IEXEC_OUT
      );
      expect(result).toStrictEqual({
        success: false,
        error: 'Partial failure',
        errorCount: 2,
        successCount: 0,
        totalCount: 2,
        results: [
          {
            index: 1,
            protectedData: process.env.IEXEC_DATASET_1_FILENAME,
            success: false,
            error: 'Failed to send email',
          },
          {
            index: 2,
            protectedData: process.env.IEXEC_DATASET_2_FILENAME,
            success: false,
            error: 'ProtectedData error: "email" must be a valid email',
          },
        ],
      });
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
      });
      expect(files.length).toBe(2);
    });

    it('should maintain single processing behavior when bulk size is 0', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '0';
      process.env.IEXEC_DATASET_FILENAME = 'data.zip';

      await expect(start()).resolves.toBeUndefined();

      const { result, computed, files } = await readOutputs(
        process.env.IEXEC_OUT
      );
      expect(result).toStrictEqual({
        success: false,
        protectedData: process.env.IEXEC_DATASET_FILENAME,
        error: 'Failed to send email',
      });
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
      });
      expect(files.length).toBe(2);
    });

    it('should handle empty bulk size gracefully', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '';
      process.env.IEXEC_DATASET_FILENAME = 'data.zip';

      await expect(start()).resolves.toBeUndefined();

      const { result, computed, files } = await readOutputs(
        process.env.IEXEC_OUT
      );
      expect(result).toStrictEqual({
        success: false,
        protectedData: process.env.IEXEC_DATASET_FILENAME,
        error: 'Failed to send email',
      });
      expect(computed).toStrictEqual({
        'deterministic-output-path': `${process.env.IEXEC_OUT}/result.json`,
      });
      expect(files.length).toBe(2);
    });

    if (
      // runs in CI with services credentials
      process.env.GITHUB_ACTIONS ||
      // or locally when all credentials are set
      (process.env.MJ_APIKEY_PUBLIC &&
        process.env.MJ_APIKEY_PRIVATE &&
        process.env.MJ_SENDER &&
        process.env.MAILGUN_APIKEY &&
        process.env.POCO_SUBGRAPH_URL)
    ) {
      describe('with credentials', () => {
        beforeEach(() => {
          // developer secret setup
          const {
            MJ_APIKEY_PUBLIC,
            MJ_APIKEY_PRIVATE,
            MJ_SENDER,
            MAILGUN_APIKEY,
            WEB3MAIL_WHITELISTED_APPS,
            POCO_SUBGRAPH_URL,
          } = process.env;
          process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
            MJ_APIKEY_PUBLIC,
            MJ_APIKEY_PRIVATE,
            MJ_SENDER,
            MAILGUN_APIKEY,
            WEB3MAIL_WHITELISTED_APPS,
            POCO_SUBGRAPH_URL,
          });

          // requester secret setup
          process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
            emailSubject: `web3mail bulk test ${
              process.env.GITHUB_SHA || 'local'
            }`,
            emailContentMultiAddr:
              '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
            emailContentEncryptionKey:
              'rjUmm5KQTwZ5oraBKMnmpgh6QM/qRR33kVF+Ct0/K6c=',
            senderName: 'bulk test',
            contentType: 'text/plain',
          });
        });

        it('should process multiple valid datasets successfully', async () => {
          process.env.IEXEC_BULK_SLICE_SIZE = '2';
          process.env.IEXEC_DATASET_1_FILENAME = 'data.zip';
          process.env.IEXEC_DATASET_2_FILENAME = 'data.zip';
          const { IEXEC_OUT } = process.env;
          await expect(start()).resolves.toBeUndefined();
          const { result, computed, files } = await readOutputs(IEXEC_OUT);
          // Verify bulk processing result structure
          expect(result).toStrictEqual({
            success: true,
            totalCount: 2,
            successCount: 2,
            errorCount: 0,
            results: [
              {
                index: 1,
                protectedData: process.env.IEXEC_DATASET_1_FILENAME,
                success: true,
              },
              {
                index: 2,
                protectedData: process.env.IEXEC_DATASET_2_FILENAME,
                success: true,
              },
            ],
          });
          // Verify computed.json structure
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${IEXEC_OUT}/result.json`,
          });
          // Verify no extra files were created
          expect(files.length).toBe(2);
        });

        it('should maintain single processing behavior when bulk size is 0', async () => {
          process.env.IEXEC_BULK_SLICE_SIZE = '0';
          process.env.IEXEC_DATASET_FILENAME = 'data.zip';
          const { IEXEC_OUT } = process.env;
          await expect(start()).resolves.toBeUndefined();
          const { result, computed, files } = await readOutputs(IEXEC_OUT);
          // Verify single processing result structure (not bulk)
          expect(result).toStrictEqual({
            success: true,
            protectedData: process.env.IEXEC_DATASET_FILENAME,
          });
          // Verify computed.json structure
          expect(computed).toStrictEqual({
            'deterministic-output-path': `${IEXEC_OUT}/result.json`,
          });
          // Verify no extra files were created
          expect(files.length).toBe(2);
        });
      });
    }
  });
});
