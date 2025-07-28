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

async function start() {
  const { IEXEC_OUT, IEXEC_APP_DEVELOPER_SECRET, IEXEC_REQUESTER_SECRET_1 } =
    process.env;

  const workerEnv = validateWorkerEnv({ IEXEC_OUT });

  // Parse and validate app secrets
  let appDeveloperSecret;
  try {
    appDeveloperSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
    appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS =
      appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS
        ? JSON.parse(appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS)
        : undefined;
  } catch (e) {
    throw new Error('Failed to parse the developer secret');
  }
  appDeveloperSecret = validateAppSecret(appDeveloperSecret);

  // Parse and validate requester secrets
  let requesterSecret;
  try {
    requesterSecret = IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw new Error('Failed to parse requester secret');
  }
  requesterSecret = validateRequesterSecret(requesterSecret);

  // Decrypt protected email
  let protectedData;
  try {
    const deserializer = new IExecDataProtectorDeserializer();
    protectedData = {
      email: await deserializer.getValue('email', 'string'),
    };
  } catch (e) {
    throw Error(`Failed to parse ProtectedData: ${e.message}`);
  }

  // Validate format
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

  // Step 5: Encode result as ABI-style bool
  const bool32Bytes = Buffer.alloc(32);
  if (isEmailValidated) {
    bool32Bytes[31] = 1; // set last byte to 1 for true
  }
  const callbackData = `0x${bool32Bytes.toString('hex')}`;

  // Write outputs
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/result.txt`,
    JSON.stringify(response, null, 2)
  );
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify({
      'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.txt`,
      ...(requesterSecret.useCallback && { 'callback-data': callbackData }),
    })
  );
}

module.exports = start;
