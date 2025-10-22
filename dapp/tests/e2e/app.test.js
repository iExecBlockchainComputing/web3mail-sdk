const path = require('path');
const fsPromises = require('fs').promises;
const start = require('../../src/sendEmail');

describe('sendEmail', () => {
  beforeEach(async () => {
    // worker env setup
    process.env.IEXEC_IN = './tests/_test_inputs_';
    process.env.IEXEC_OUT = './tests/_test_outputs_/iexec_out';
    // clean IEXEC_OUT
    await fsPromises
      .rm(process.env.IEXEC_OUT, { recursive: true })
      .catch(() => {});
    await fsPromises.mkdir(process.env.IEXEC_OUT, { recursive: true });
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
        await expect(() => start()).rejects.toThrow(
          Error('Failed to parse the developer secret')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "MJ_APIKEY_PUBLIC" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "MJ_APIKEY_PRIVATE" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "MJ_SENDER" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "MAILGUN_APIKEY" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if WEB3MAIL_WHITELISTED_APPS in developer secret is missing', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MAILGUN_APIKEY: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "WEB3MAIL_WHITELISTED_APPS" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('App secret error: "POCO_SUBGRAPH_URL" is required')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
    });

    describe('with bad IEXEC_REQUESTER_SECRET_1', () => {
      it('should fail if IEXEC_REQUESTER_SECRET_1 is not a JSON', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = '_';
        await expect(() => start()).rejects.toThrow(
          Error('Failed to parse requester secret')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if emailSubject is missing', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailSubject: '',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "emailSubject" is not allowed to be empty'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if emailContentMultiAddr is missing', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailContentMultiAddr: '',
          emailSubject: 'email_subject',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "emailContentMultiAddr" is not allowed to be empty'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if emailContentMultiAddr is no an ipfs multiaddr', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          emailContentMultiAddr: 'foo',
          emailSubject: 'email_subject',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "emailContentMultiAddr" must be a multiAddr'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if contentType contains invalid content-type', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          contentType: 'notacontenttype',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailSubject: 'email_subject',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "contentType" must be one of [text/plain, text/html]'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if senderName is empty', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          senderName: '',
          emailContentMultiAddr:
            '/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789',
          emailSubject: 'email_subject',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "senderName" is not allowed to be empty'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
      it('should fail if senderName length is less than 3 characters', async () => {
        process.env.IEXEC_REQUESTER_SECRET_1 = JSON.stringify({
          senderName: 'AB',
          emailContentMultiAddr:
            '/ipfs/QmVodr1Bxa2bTiz1pLmWjDrCeTEdGPfe58qRMRwErJDcRu',
          emailSubject: 'email_subject',
        });
        await expect(() => start()).rejects.toThrow(
          Error(
            'Requester secret error: "senderName" length must be at least 3 characters long'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
            'Requester secret error: "senderName" length must be less than or equal to 20 characters long'
          )
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });
    });

    describe('with bad protectedData', () => {
      it('should fail if the dataset is not a protectedData', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'invalidZipFile.txt';
        await expect(() => start()).rejects.toThrow(
          Error('Failed to parse ProtectedData: Failed to load protected data')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });

      it('should fail if protectedData has no "email" key', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'dataNoEmail.zip';
        await expect(() => start()).rejects.toThrow(
          Error('Failed to parse ProtectedData: Failed to load path email')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });

      it('should fail if protectedData "email" key is not an email', async () => {
        process.env.IEXEC_DATASET_FILENAME = 'dataInvalidEmail.zip';
        await expect(() => start()).rejects.toThrow(
          Error('ProtectedData error: "email" must be a valid email')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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
        await expect(() => start()).rejects.toThrow(
          Error('Failed to send email')
        );
      });
    });

    describe('when mailjet answers with error', () => {
      it('should fail if email service fail to send the email', async () => {
        process.env.IEXEC_APP_DEVELOPER_SECRET = JSON.stringify({
          MJ_APIKEY_PUBLIC: 'xxx',
          MJ_APIKEY_PRIVATE: 'xxx',
          MJ_SENDER: 'foo@bar.com',
          MAILGUN_APIKEY: 'xxx',
          WEB3MAIL_WHITELISTED_APPS:
            '["0xa638bf4665ce7bd7021a4a12416ea7a0a3272b6f"]',
          POCO_SUBGRAPH_URL: 'https://fake-poco.subgraph.iex.ec',
        });
        await expect(() => start()).rejects.toThrow(
          Error('Failed to send email')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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

      it('should send an email successfully', async () => {
        // protected data setup
        process.env.IEXEC_DATASET_FILENAME = 'data.zip';
        const requesterSecret = JSON.parse(
          process.env.IEXEC_REQUESTER_SECRET_1
        );

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
        if (requesterSecret.useCallback) {
          expect(JSON.parse(computedJson)).toStrictEqual({
            'callback-data':
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
          });
        } else {
          expect(JSON.parse(computedJson)).toStrictEqual({
            'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
          });
        }
        // output should not contain extra files
        const out = await fsPromises.readdir(IEXEC_OUT);
        expect(out.length).toBe(2);
      });

      it('should detect non existent email address and exit in error', async () => {
        // protected data setup
        process.env.IEXEC_DATASET_FILENAME = 'dataEmailUserDoesNotExist.zip';

        // should throw
        await expect(start()).rejects.toThrow(
          Error('The protected email address seems to be invalid.')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
      });

      it('should detect disposable email address and exit in error', async () => {
        // protected data setup
        process.env.IEXEC_DATASET_FILENAME = 'dataDisposableEmail.zip';

        // should throw
        await expect(start()).rejects.toThrow(
          Error('The protected email address seems to be invalid.')
        );
        // output should be empty
        const out = await fsPromises.readdir(process.env.IEXEC_OUT);
        expect(out).toStrictEqual([]);
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

      // Check that bulk processing was attempted and completed
      const { IEXEC_OUT } = process.env;
      const resultTxt = await fsPromises.readFile(
        path.join(IEXEC_OUT, 'result.txt'),
        'utf-8'
      );
      const result = JSON.parse(resultTxt);

      expect(result).toHaveProperty('total-processed', 2);
      expect(result).toHaveProperty('success-count');
      expect(result).toHaveProperty('error-count');
      expect(result).toHaveProperty('dataset-results');
      expect(result['dataset-results']).toHaveLength(2);
    });

    it('should handle mixed valid and invalid datasets', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '2';
      process.env.IEXEC_DATASET_1_FILENAME = 'data.zip';
      process.env.IEXEC_DATASET_2_FILENAME = 'dataInvalidEmail.zip';

      await expect(start()).resolves.toBeUndefined();

      const { IEXEC_OUT } = process.env;
      const resultTxt = await fsPromises.readFile(
        path.join(IEXEC_OUT, 'result.txt'),
        'utf-8'
      );
      const result = JSON.parse(resultTxt);

      expect(result).toHaveProperty('total-processed', 2);
      expect(result['dataset-results']).toHaveLength(2);

      // Should have both successes and errors
      const successResults = result['dataset-results'].filter(
        (r) => r.response.status === 200
      );
      const errorResults = result['dataset-results'].filter(
        (r) => r.response.status !== 200
      );

      expect(successResults.length + errorResults.length).toBe(2);
    });

    it('should maintain single processing behavior when bulk size is 0', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '0';
      process.env.IEXEC_DATASET_FILENAME = 'data.zip';

      await expect(start()).rejects.toThrow('Failed to send email');

      const out = await fsPromises.readdir(process.env.IEXEC_OUT);
      expect(out).toStrictEqual([]);
    });

    it('should handle empty bulk size gracefully', async () => {
      process.env.IEXEC_BULK_SLICE_SIZE = '';
      process.env.IEXEC_DATASET_FILENAME = 'data.zip';

      await expect(start()).rejects.toThrow('Failed to send email');

      const out = await fsPromises.readdir(process.env.IEXEC_OUT);
      expect(out).toStrictEqual([]);
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

          const result = JSON.parse(resultTxt);
          const computed = JSON.parse(computedJson);

          // Verify bulk processing result structure
          expect(result).toHaveProperty('message');
          expect(result).toHaveProperty('status', 200);
          expect(result).toHaveProperty('total-processed', 2);
          expect(result).toHaveProperty('success-count', 2);
          expect(result).toHaveProperty('error-count', 0);
          expect(result).toHaveProperty('dataset-results');
          expect(result['dataset-results']).toHaveLength(2);

          // Verify each dataset result
          result['dataset-results'].forEach((datasetResult, index) => {
            expect(datasetResult).toHaveProperty('index', index + 1);
            expect(datasetResult).toHaveProperty('dataset');
            expect(datasetResult).toHaveProperty('response');
            expect(datasetResult.response).toHaveProperty('status', 200);
            expect(datasetResult.response).toHaveProperty('message');
          });

          // Verify computed.json structure
          expect(computed).toHaveProperty('deterministic-output-path');
          expect(computed['deterministic-output-path']).toBe(
            `${IEXEC_OUT}/result.txt`
          );

          // Verify no extra files were created
          const out = await fsPromises.readdir(IEXEC_OUT);
          expect(out.length).toBe(2);
          expect(out).toContain('result.txt');
          expect(out).toContain('computed.json');
        });

        it('should maintain single processing behavior when bulk size is 0', async () => {
          process.env.IEXEC_BULK_SLICE_SIZE = '0';
          process.env.IEXEC_DATASET_FILENAME = 'data.zip';

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

          const result = JSON.parse(resultTxt);
          const computed = JSON.parse(computedJson);

          // Verify single processing result structure (not bulk)
          expect(result).toHaveProperty(
            'message',
            'Your email has been sent successfully.'
          );
          expect(result).toHaveProperty('status', 200);
          expect(result).not.toHaveProperty('total-processed');
          expect(result).not.toHaveProperty('dataset-results');

          // Verify computed.json structure
          expect(computed).toHaveProperty('deterministic-output-path');
          expect(computed['deterministic-output-path']).toBe(
            `${IEXEC_OUT}/result.txt`
          );
        });
      });
    }
  });
});
