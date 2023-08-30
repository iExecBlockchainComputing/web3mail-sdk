const { promises: fs } = require('fs');
const sendEmail = require('./emailService');
const validateInputs = require('./validateInputs');
const extractZipAndBuildJson = require('./extractEmailFromZipFile');

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
  let options;
  try {
    options = process.env.IEXEC_REQUESTER_SECRET_3
      ? JSON.parse(process.env.IEXEC_REQUESTER_SECRET_3)
      : {};
  } catch {
    throw Error('Failed to parse options from requester secret');
  }
  const unsafeEnvVars = {
    iexecIn: process.env.IEXEC_IN,
    iexecOut: process.env.IEXEC_OUT,
    dataFileName: process.env.IEXEC_DATASET_FILENAME,
    mailJetApiKeyPublic: developerSecret.MJ_APIKEY_PUBLIC,
    mailJetApiKeyPrivate: developerSecret.MJ_APIKEY_PRIVATE,
    mailJetSender: developerSecret.MJ_SENDER,
    emailSubject: process.env.IEXEC_REQUESTER_SECRET_1,
    emailContent: process.env.IEXEC_REQUESTER_SECRET_2,
    contentType: options.contentType,
    senderTag: options.senderTag,
  };
  const envVars = validateInputs(unsafeEnvVars);
  const email = await extractZipAndBuildJson(
    `${envVars.iexecIn}/${envVars.dataFileName}`
  );
  if (!email) {
    throw new Error('Missing email in protectedData');
  }
  const response = await sendEmail({
    email,
    mailJetApiKeyPublic: envVars.mailJetApiKeyPublic,
    mailJetApiKeyPrivate: envVars.mailJetApiKeyPrivate,
    emailSubject: envVars.emailSubject,
    emailContent: envVars.emailContent,
    mailJetSender: envVars.mailJetSender,
    contentType: envVars.contentType,
    senderTag: envVars.senderTag,
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
