const { promises: fs } = require('fs');
const {
  IExecDataProtectorDeserializer,
} = require('@iexec/dataprotector-deserializer');
const sendEmail = require('./emailService');
const validateInputs = require('./validateInputs');
const {
  downloadEncryptedContent,
  decryptContent,
} = require('./decryptEmailContent');

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
  // Parse the developer secret environment variable
  let developerSecret;
  try {
    developerSecret = JSON.parse(process.env.IEXEC_APP_DEVELOPER_SECRET);
  } catch {
    throw Error('Failed to parse the developer secret');
  }
  let requesterSecret;
  try {
    requesterSecret = process.env.IEXEC_REQUESTER_SECRET_1
      ? JSON.parse(process.env.IEXEC_REQUESTER_SECRET_1)
      : {};
  } catch {
    throw Error('Failed to parse requester secret');
  }

  const deserializer = new IExecDataProtectorDeserializer();
  const email = await deserializer.getValue('email', 'string');

  const unsafeEnvVars = {
    iexecOut: process.env.IEXEC_OUT,
    mailJetApiKeyPublic: developerSecret.MJ_APIKEY_PUBLIC,
    mailJetApiKeyPrivate: developerSecret.MJ_APIKEY_PRIVATE,
    mailJetSender: developerSecret.MJ_SENDER,
    emailSubject: requesterSecret.emailSubject,
    emailContentMultiAddr: requesterSecret.emailContentMultiAddr,
    contentType: requesterSecret.contentType,
    senderName: requesterSecret.senderName,
    emailContentEncryptionKey: requesterSecret.emailContentEncryptionKey,
  };
  const envVars = validateInputs(unsafeEnvVars);
  const encryptedEmailContent = await downloadEncryptedContent(
    envVars.emailContentMultiAddr
  );
  const emailContent = decryptContent(
    encryptedEmailContent,
    envVars.emailContentEncryptionKey
  );

  const response = await sendEmail({
    email,
    mailJetApiKeyPublic: envVars.mailJetApiKeyPublic,
    mailJetApiKeyPrivate: envVars.mailJetApiKeyPrivate,
    emailSubject: envVars.emailSubject,
    emailContent,
    mailJetSender: envVars.mailJetSender,
    contentType: envVars.contentType,
    senderName: envVars.senderName,
  });

  await writeTaskOutput(
    `${envVars.iexecOut}/result.txt`,
    JSON.stringify(response, null, 2)
  );
  await writeTaskOutput(
    `${envVars.iexecOut}/computed.json`,
    JSON.stringify({
      'deterministic-output-path': `${envVars.iexecOut}/result.txt`,
    })
  );
}

module.exports = start;
