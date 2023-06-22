const Mailjet = require('node-mailjet');

async function sendEmail({
  email,
  mailJetApiKeyPublic,
  mailJetApiKeyPrivate,
  emailSubject,
  emailContent,
  mailJetSender,
}) {
  const mailjet = Mailjet.apiConnect(mailJetApiKeyPublic, mailJetApiKeyPrivate);
  await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: 'Web3mail Dapp Sender',
          },
          To: [
            {
              Email: email,
              Name: '',
            },
          ],
          Subject: emailSubject,
          TextPart: emailContent,
        },
      ],
    })
    .catch(() => {
      throw new Error('Failed to send email');
    });
  return {
    message: 'Your email has been sent successfully.',
    status: 200,
  };
}
module.exports = sendEmail;
