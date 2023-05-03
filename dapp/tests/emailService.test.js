const sendEmail = require("../src/emailService");

describe("sendEmail", () => {
  it("should send an email successfully", async () => {
    const email = "benayache.abbes@gmail.com";
    const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER } = JSON.parse(
      process.env.IEXEC_APP_DEVELOPER_SECRET,
    );
    const mailObject = "Test Email";
    const mailContent = "Hello World!";
    const response = await sendEmail({
      email,
      mailJetApiKeyPublic: MJ_APIKEY_PUBLIC,
      mailJetApiKeyPrivate: MJ_APIKEY_PRIVATE,
      mailObject,
      mailContent,
      mailJetSender: MJ_SENDER,
    });
    expect(response.response.status).toBe(200);
  });
});
