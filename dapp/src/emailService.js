import Mailjet from 'node-mailjet';

async function sendEmail({
  email,
  mailJetApiKeyPublic,
  mailJetApiKeyPrivate,
  emailSubject,
  emailContent,
  mailJetSender,
  contentType = 'text/plain',
  senderName,
}) {
  const mailjet = Mailjet.apiConnect(mailJetApiKeyPublic, mailJetApiKeyPrivate);

  const TextPart = contentType === 'text/plain' ? emailContent : undefined;
  const HTMLPart = contentType === 'text/html' ? emailContent : undefined;
  const emailFromName = senderName ? `${senderName} via Web3mail` : 'Web3mail';

  await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: emailFromName,
          },
          To: [
            {
              Email: email,
              Name: '',
            },
          ],
          Subject: emailSubject,
          TextPart,
          HTMLPart,
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
export default sendEmail;
