const sendEmail = require("../src/emailService");
const extractZipAndBuildJson = require("../src/extractJsonFromZip");

describe("sendEmail", () => {
  it("should send an email successfully", async () => {
    const zipPath =
      "/home/abbes/iexec_workspace/github/web3Mail/dapp/tests/iexec_in/myProtectedData.zip";
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
