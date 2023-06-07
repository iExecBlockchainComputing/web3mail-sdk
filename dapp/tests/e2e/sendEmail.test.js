const sendEmail = require('../../src/emailService');
const extractEmailFromZipFile = require('../../src/extractEmailFromZipFile');
const path = require('path');

describe('sendEmail', () => {
  it('should send an email successfully', async () => {
    // Place your .zip file in the /dapp/tests/_test_inputs_ directory
    // The .zip file should contain a file with the email content you want to protect
    // Define the absolute path of the .zip file containing the protected data
    const zipPath = path.join(__dirname, '../_test_inputs_/data.zip');
    const email = await extractEmailFromZipFile(zipPath);

    const { MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER } = JSON.parse(
      process.env.IEXEC_APP_DEVELOPER_SECRET
    );
    const emailSubject = 'Test Email';
    const emailContent = 'Hello World!';
    const response = await sendEmail({
      email,
      mailJetApiKeyPublic: MJ_APIKEY_PUBLIC,
      mailJetApiKeyPrivate: MJ_APIKEY_PRIVATE,
      emailSubject,
      emailContent,
      mailJetSender: MJ_SENDER,
    });
    expect(response.status).toBe(200);
  });
});
