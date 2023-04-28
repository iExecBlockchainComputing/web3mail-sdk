const Mailjet = require("node-mailjet");

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
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: "Web3Mail Dapp Sender",
          },
          To: [
            {
              Email: email,
              Name: "",
            },
          ],
          Subject: mailObject,
          TextPart: mailContent,
        },
      ],
    })
    .catch(() => {
      throw new Error("Failed to send email");
    });

  if (response.response.status === 200) {
    console.log(
      `Email: ${mailObject} with content "${mailContent}" has been sent to ${email} successfully.`,
    );
  } else {
    console.error(`Failed to send email to ${email}`);
  }
}
module.exports = sendEmail;
