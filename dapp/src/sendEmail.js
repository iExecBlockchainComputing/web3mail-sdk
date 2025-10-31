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

async function writeTaskOutput(path, message) {
  try {
    await fs.writeFile(path, message);
    console.log(`File successfully written at path: ${path}`);
  } catch {
    console.error(`Failed to write Task Output`);
    process.exit(1);
  }
}

async function processProtectedData(
  index,
  {
    IEXEC_IN,
    IEXEC_OUT,
    appDeveloperSecret,
    requesterSecret,
    datasetFilename = null,
  }
) {
  // Parse the protected data
  let protectedData;
  try {
    const deserializerConfig = datasetFilename
      ? { protectedDataPath: `${IEXEC_IN}/${datasetFilename}` }
      : {};

    const deserializer = new IExecDataProtectorDeserializer(deserializerConfig);
    protectedData = {
      email: await deserializer.getValue('email', 'string'),
    };
  } catch (e) {
    const errorMessage =
      index === 0
        ? `Failed to parse ProtectedData: ${e.message}`
        : `Failed to parse ProtectedData ${index}: ${e.message}`;
    throw Error(errorMessage);
  }

  // Validate the protected data
  validateProtectedData(protectedData);

  // Step 1: Check if email was already validated
  let isEmailValidated = await checkEmailPreviousValidation({
    datasetAddress: protectedData.email,
    dappAddresses: appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS,
    pocoSubgraphUrl: appDeveloperSecret.POCO_SUBGRAPH_URL,
  });

  // Step 2: If not, try Mailgun
  if (!isEmailValidated) {
    console.log('No prior verification found. Trying Mailgun...');
    const mailgunResult = await validateEmailAddress({
      emailAddress: protectedData.email,
      mailgunApiKey: appDeveloperSecret.MAILGUN_APIKEY,
    });

    if (mailgunResult === true) {
      isEmailValidated = true;
    } else if (mailgunResult === false) {
      throw Error('The protected email address seems to be invalid.');
    } else {
      console.warn(
        'Mailgun verification failed or was unreachable. Proceeding without check.'
      );
    }
  } else {
    console.log('Email already verified, skipping Mailgun check.');
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
  const response = await sendEmail({
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

  if (index === 0) {
    await writeTaskOutput(
      `${IEXEC_OUT}/result.txt`,
      JSON.stringify(response, null, 2)
    );
  }

  return { index, response, isEmailValidated };
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

  // Parse the requester secret environment variable
  let requesterSecret;
  try {
    requesterSecret = IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw Error('Failed to parse requester secret');
  }
  requesterSecret = validateRequesterSecret(requesterSecret);

  const bulkSize = parseInt(IEXEC_BULK_SLICE_SIZE, 10) || 0;
  const results = [];

  if (bulkSize > 0) {
    // Process multiple protected data
    const promises = [];
    for (let i = 1; i <= bulkSize; i += 1) {
      const datasetFilename = process.env[`IEXEC_DATASET_${i}_FILENAME`];

      const promise = processProtectedData(i, {
        IEXEC_IN,
        IEXEC_OUT: workerEnv.IEXEC_OUT,
        appDeveloperSecret,
        requesterSecret,
        datasetFilename,
      })
        .then((result) => result)
        .catch((error) => ({
          index: i,
          resultFileName: datasetFilename
            ? `${datasetFilename}.txt`
            : `dataset-${i}.txt`,
          response: {
            status: 500,
            message: `Failed to process dataset ${i}: ${error.message}`,
          },
        }));

      promises.push(promise);
    }

    const bulkResults = await Promise.all(promises);
    results.push(...bulkResults);
  } else {
    // Process single protected data
    const result = await processProtectedData(0, {
      IEXEC_IN,
      IEXEC_OUT: workerEnv.IEXEC_OUT,
      appDeveloperSecret,
      requesterSecret,
    });

    results.push(result);
  }

  // Create result.txt for bulk processing
  if (bulkSize > 0) {
    const successCount = results.filter(
      (r) => r.response.status === 200
    ).length;
    const errorCount = results.filter((r) => r.response.status !== 200).length;

    const bulkResult = {
      message: `Bulk processing completed: ${successCount} successful, ${errorCount} failed`,
      status: 200,
      'total-processed': results.length,
      'success-count': successCount,
      'error-count': errorCount,
      'protected-data-results': results.map((r) => ({
        index: r.index,
        protectedData: process.env[`IEXEC_DATASET_${r.index}_FILENAME`],
        response: r.response,
      })),
    };

    await writeTaskOutput(
      `${workerEnv.IEXEC_OUT}/result.txt`,
      JSON.stringify(bulkResult, null, 2)
    );
  }

  const computedData = {
    'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.txt`,
  };

  // Add callback data for single processing if useCallback is enabled
  if (bulkSize === 0 && requesterSecret.useCallback && results[0]) {
    const bool32Bytes = Buffer.alloc(32);
    if (results[0].isEmailValidated) {
      bool32Bytes[31] = 1; // set last byte to 1 for true
    }
    const callbackData = `0x${bool32Bytes.toString('hex')}`;
    computedData['callback-data'] = callbackData;
  }

  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify(computedData, null, 2)
  );
}

module.exports = start;
