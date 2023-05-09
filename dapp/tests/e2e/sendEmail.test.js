const sendEmail = require("../../src/emailService");
const extractZipAndBuildJson = require("../../src/extractJsonFromZip");

describe("sendEmail", () => {
  it("should send an email successfully", async () => {
    // Place your .zip file in the /dapp/tests/_test_inputs_ directory
    // The .zip file should contain a file with the email content you want to protect
    // Define the absolute path of the .zip file containing the protected data
    const zipPath =
      "/home/abbes/iexec_workspace/github/web3Mail/dapp/tests/_test_inputs_/myProtectedData.zip";
    const result = await extractZipAndBuildJson(zipPath);

    const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER } = JSON.parse(
      process.env.IEXEC_APP_DEVELOPER_SECRET,
    );
    const mailObject = "Test Email";
    const mailContent = "Hello World!";
    const response = await sendEmail({
      email: result.email,
      mailJetApiKeyPublic: MJ_APIKEY_PUBLIC,
      mailJetApiKeyPrivate: MJ_APIKEY_PRIVATE,
      mailObject,
      mailContent,
      mailJetSender: MJ_SENDER,
    });
    expect(response.response.status).toBe(200);
  });
});
