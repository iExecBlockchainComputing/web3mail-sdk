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
  } catch (e) {
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

  // Get the secret email address from the protected data
  let protectedData;
  try {
    const deserializer = new IExecDataProtectorDeserializer();
    protectedData = {
      email: await deserializer.getValue('email', 'string'),
    };
  } catch (e) {
    throw Error(`Failed to parse ProtectedData: ${e.message}`);
  }

  // 1- Validate email address syntax (Joi regexp)
  validateProtectedData(protectedData);

  // --- NEW: Check if email was already verified ---
  const isEmailVerified = await checkEmailPreviousValidation({
    datasetAddress: protectedData.email, // email = dataset
    dappAddresses: appDeveloperSecret.WEB3MAIL_WHITELISTED_APPS, // array of iApp addresses
  });

  if (!isEmailVerified) {
    // Run Mailgun validation if not previously verified
    await validateEmailAddress({
      emailAddress: protectedData.email,
      mailgunApiKey: appDeveloperSecret.MAILGUN_APIKEY,
    });
  } else {
    console.log('Email already verified, skipping Mailgun check.');
  }

  const encryptedEmailContent = await downloadEncryptedContent(
    requesterSecret.emailContentMultiAddr
  );
  const requesterEmailContent = decryptContent(
    encryptedEmailContent,
    requesterSecret.emailContentEncryptionKey
  );

  const response = await sendEmail({
    // from protected data
    email: protectedData.email,
    // from app developer secrets
    mailJetApiKeyPublic: appDeveloperSecret.MJ_APIKEY_PUBLIC,
    mailJetApiKeyPrivate: appDeveloperSecret.MJ_APIKEY_PRIVATE,
    mailJetSender: appDeveloperSecret.MJ_SENDER,
    mailgunApiKey: appDeveloperSecret.MAILGUN_APIKEY,
    // from requester secret
    emailContent: requesterEmailContent,
    emailSubject: requesterSecret.emailSubject,
    contentType: requesterSecret.contentType,
    senderName: requesterSecret.senderName,
  });

  const bool32Bytes = Buffer.alloc(32);
  if (isEmailVerified) {
    bool32Bytes[31] = 1; // set last byte to 1 for true
  }
  const callbackData = `0x${bool32Bytes.toString('hex')}`;

  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/result.txt`,
    JSON.stringify(response, null, 2)
  );
  await writeTaskOutput(
    `${workerEnv.IEXEC_OUT}/computed.json`,
    JSON.stringify({
      'deterministic-output-path': `${workerEnv.IEXEC_OUT}/result.txt`,
      'callback-data': callbackData,
    })
  );
}

module.exports = start;
