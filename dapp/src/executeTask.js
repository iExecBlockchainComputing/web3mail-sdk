const { promises: fs } = require('fs');
const {
  IExecDataProtectorDeserializer,
} = require('@iexec/dataprotector-deserializer');
const sendEmail = require('./emailService');
const {
  validateWorkerEnv,
  validateAppSecret,
  validateRequesterSecret,
  validateProtectedData,
} = require('./validation');
const {
  downloadEncryptedContent,
  decryptContent,
} = require('./decryptEmailContent');
const { validateEmailAddress } = require('./validateEmailAddress');
const {
  checkEmailPreviousValidation,
} = require('./checkEmailPreviousValidation');

async function processProtectedData({
  index,
  IEXEC_IN,
  appDeveloperSecret,
  requesterSecret,
}) {
  const datasetFilename =
    index > 0
      ? process.env[`IEXEC_DATASET_${index}_FILENAME`]
      : process.env.IEXEC_DATASET_FILENAME;
  const result = {
    index,
    protectedData: datasetFilename,
    isEmailValid: undefined,
  };
  try {
    let protectedData;
    try {
      const deserializerConfig = datasetFilename
        ? { protectedDataPath: `${IEXEC_IN}/${datasetFilename}` }
        : {};
      const deserializer = new IExecDataProtectorDeserializer(
        deserializerConfig
      );
      protectedData = {
        email: await deserializer.getValue('email', 'string'),
      };
    } catch (e) {
      throw Error(`Failed to parse ProtectedData ${index}: ${e.message}`);
    }

    // Validate the protected data
    validateProtectedData(protectedData);

    // Step 1: Check if email was already validated
    result.isEmailValid = await checkEmailPreviousValidation({
      datasetAddress: protectedData.email,
      dappAddresses: appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS,
      pocoSubgraphUrl: appDeveloperSecret.POCO_SUBGRAPH_URL,
    });

    // Step 2: If not, try Mailgun
    if (result.isEmailValid === undefined) {
      console.log('No prior verification found. Trying Mailgun...');
      result.isEmailValid = await validateEmailAddress({
        emailAddress: protectedData.email,
        mailgunApiKey: appDeveloperSecret.MAILGUN_APIKEY,
      });
    } else {
      console.log('Email already verified, skipping Mailgun check.');
    }

    if (result.isEmailValid === false) {
      throw Error('The protected email address seems to be invalid.');
    }

    // Step 3: Decrypt email content
    const encryptedEmailContent = await downloadEncryptedContent(
      requesterSecret.emailContentMultiAddr
    );
    const requesterEmailContent = decryptContent(
      encryptedEmailContent,
      requesterSecret.emailContentEncryptionKey
    );

    // Step 4: Send email
    await sendEmail({
      email: protectedData.email,
      mailJetApiKeyPublic: appDeveloperSecret.MJ_APIKEY_PUBLIC,
      mailJetApiKeyPrivate: appDeveloperSecret.MJ_APIKEY_PRIVATE,
      mailJetSender: appDeveloperSecret.MJ_SENDER,
      mailgunApiKey: appDeveloperSecret.MAILGUN_APIKEY,
      emailContent: requesterEmailContent,
      emailSubject: requesterSecret.emailSubject,
      contentType: requesterSecret.contentType,
      senderName: requesterSecret.senderName,
    });
    result.success = true;
  } catch (e) {
    result.success = false;
    result.error = e.message;
  }
  console.log(`Protected data ${index} processed:`, result);
  return result;
}

async function start() {
  const {
    IEXEC_IN,
    IEXEC_OUT,
    IEXEC_APP_DEVELOPER_SECRET,
    IEXEC_REQUESTER_SECRET_1,
    IEXEC_BULK_SLICE_SIZE,
  } = process.env;

  // Check worker env
  const workerEnv = validateWorkerEnv({ IEXEC_OUT });

  let result; // { success: boolean, error?: string, protectedData?: string, results?: { index: number, protectedData: string, success: boolean, error?: string }[] }
  let callbackData;
  try {
    // Parse the app developer secret environment variable
    let appDeveloperSecret;
    try {
      appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
      appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS =
        appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS
          ? JSON.parse(appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS)
          : undefined;
    } catch {
      throw Error('Failed to parse the developer secret');
    }
    appDeveloperSecret = validateAppSecret(appDeveloperSecret);

    let requesterSecret;
    try {
      requesterSecret = JSON.parse(IEXEC_REQUESTER_SECRET_1);
    } catch {
      throw Error('Failed to parse requester secret');
    }
    requesterSecret = validateRequesterSecret(requesterSecret);

    const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE, 10) || 0;

    // Process multiple protected data
    if (bulkSize > 0) {
      console.log(`Processing ${bulkSize} protected data...`);
      const processPromises = new Array(bulkSize).fill(null).map((_, index) =>
        processProtectedData({
          index: index + 1,
          IEXEC_IN,
          appDeveloperSecret,
          requesterSecret,
        })
      );
      const results = await Promise.all(processPromises);
      const successCount = results.filter((r) => r.success === true).length;
      const errorCount = results.filter((r) => r.success !== true).length;
      result = {
        success: errorCount === 0,
        error: errorCount > 0 ? 'Partial failure' : undefined,
        totalCount: results.length,
        successCount,
        errorCount,
        results: results.map((r) => ({
          index: r.index,
          protectedData: r.protectedData,
          success: r.success,
          isEmailValid: r.isEmailValid,
          error: r.error,
        })),
      };
    } else {
      console.log('Processing single protected data...');
      const { protectedData, success, error, isEmailValid } =
        await processProtectedData({
          index: 0,
          IEXEC_IN,
          appDeveloperSecret,
          requesterSecret,
        });
      // set result json
      result = { protectedData, success, isEmailValid, error };
      // Add callback data for single processing if useCallback is enabled
      if (requesterSecret.useCallback) {
        const bool32Bytes = Buffer.alloc(32);
        // Encode 2 bits:
        // - Bit 1: Email validation was performed (1 = yes, 0 = no)
        // - Bit 0: Email is valid (1 = yes, 0 = no)
        if (isEmailValid === true) {
          // eslint-disable-next-line no-bitwise
          bool32Bytes[31] |= 0b11;
        } else if (isEmailValid === false) {
          // eslint-disable-next-line no-bitwise
          bool32Bytes[31] |= 0b10;
        }
        callbackData = `0x${bool32Bytes.toString('hex')}`;
      }
    }
  } catch (e) {
    console.error('Something went wrong:', e.message);
    result = { success: false, error: e.message };
  }

  console.log('Writing results:', JSON.stringify(result));
  await fs.writeFile(
    `${workerEnv.IEXEC_OUT}/result.json`,
    JSON.stringify(result, null, 2)
  );

  const computedData = {
    'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.json`,
    'callback-data': callbackData,
  };

  await fs.writeFile(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify(computedData, null, 2)
  );
}

module.exports = start;
