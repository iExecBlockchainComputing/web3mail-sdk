import Mailjet from 'node-mailjet';

export async function sendEmail({
  email,
  mailJetApiKeyPublic,
  mailJetApiKeyPrivate,
  mailObject,
  mailContent,
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
    .catch(() => {
      throw new Error('Failed to send email');
    });
  return {
    message: 'Your email has been sent successfully.',
    status: 200,
  };
}
