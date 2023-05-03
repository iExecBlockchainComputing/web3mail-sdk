const { promises: fs } = require("fs");
const sendEmail = require("./emailService");
const validateInputs = require("./validateInputs");
const extractZipAndBuildJson = require("./extractJsonFromZip");
require("dotenv").config();

async function writeTaskOutput(path, message) {
  try {
    await fs.writeFile(path, message);
  } catch (error) {
    console.error(`Failed to write Task Output : ${error.message}`);
    process.exit(1);
  }
}

async function start() {
  try {
    const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER } = JSON.parse(
      process.env.IEXEC_APP_DEVELOPER_SECRET,
    );
    const envVars = {
      iexecIn: process.env.IEXEC_IN,
      iexecOut: process.env.IEXEC_OUT,
      dataFileName: process.env.IEXEC_DATASET_FILENAME,
      mailJetApiKeyPublic: MJ_APIKEY_PUBLIC,
      mailJetApiKeyPrivate: MJ_APIKEY_PRIVATE,
      mailJetSender: MJ_SENDER,
      mailObject: process.env.IEXEC_REQUESTER_SECRET_1,
      mailContent: process.env.IEXEC_REQUESTER_SECRET_2,
    };
    validateInputs(envVars);
    const data = await extractZipAndBuildJson(
      `${envVars.iexecIn}/${envVars.dataFileName}`,
    );
    if (!data.email) {
      throw new Error("Missing email in protectedData");
    }
    const response = await sendEmail({
      email: data.email,
      mailJetApiKeyPublic: envVars.mailJetApiKeyPublic,
      mailJetApiKeyPrivate: envVars.mailJetApiKeyPrivate,
      mailObject: envVars.mailObject,
      mailContent: envVars.mailContent,
      mailJetSender: envVars.mailJetSender,
    });

    await writeTaskOutput(
      `${envVars.iexecOut}/result.txt`,
      JSON.stringify(response.body, null, 2),
    );
    await writeTaskOutput(
      `${envVars.iexecOut}/computed.json`,
      JSON.stringify({
        "deterministic-output-path": `${envVars.iexecOut}/result.txt`,
      }),
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

start();
