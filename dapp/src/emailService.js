const Mailjet = require('node-mailjet');

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

  // Optimisation : éviter les variables temporaires inutiles
  const emailFromName = senderName ? `${senderName} via Web3mail` : 'Web3mail';

  // Optimisation : construire l'objet message directement
  let message = {
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
  };

  // Ajouter le contenu selon le type
  if (contentType === 'text/plain') {
    message.TextPart = emailContent;
  } else if (contentType === 'text/html') {
    message.HTMLPart = emailContent;
  }

  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [message],
    });

    return {
      message: 'Your email has been sent successfully.',
      status: 200,
    };
  } catch (error) {
    throw new Error('Failed to send email');
  } finally {
    // Libérer la mémoire
    message = null;
  }
}

module.exports = sendEmail;
