const Mailjet = require('node-mailjet');

async function sendEmail({
  email,
  mailJetApiKeyPublic,
  mailJetApiKeyPrivate,
  mailObject,
  mailContent,
  mailJetSender,
}) {
  const mailjet = Mailjet.apiConnect(mailJetApiKeyPublic, mailJetApiKeyPrivate);
  const response = await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: 'Web3Mail Dapp Sender',
          },
          To: [
            {
              Email: email,
              Name: '',
            },
          ],
          Subject: mailObject,
          TextPart: mailContent,
        },
      ],
    })
    .catch((err) => {
      throw new Error('Failed to send email');
    });
  return response;
}
module.exports = sendEmail;
