const Mailjet = require("node-mailjet");
const sendEmail = require("../../src/emailService");

describe("sendEmail", () => {
  it("sends an email successfully", async () => {
    const email = "recipient@example.com";
    const mailJetApiKeyPublic = "myApiKeyPublic";
    const mailJetApiKeyPrivate = "myApiKeyPrivate";
    const mailObject = "Test email";
    const mailContent = "This is a test email.";
    const mailJetSender = "sender@example.com";
    const mockResponse = {
      body: {
        Messages: [
          {
            Status: "success",
            To: [{ Email: email }],
          },
        ],
      },
    };
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockResolvedValue(mockResponse),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    const response = await sendEmail({
      email,
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate,
      mailObject,
      mailContent,
      mailJetSender,
    });

    expect(Mailjet.apiConnect).toHaveBeenCalledWith(
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate,
    );
    expect(mockMailjet.post).toHaveBeenCalledWith("send", { version: "v3.1" });
    expect(mockMailjet.request).toHaveBeenCalledWith({
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
    });
    expect(response).toEqual(mockResponse);
  });

  it("throws an error if the email fails to send", async () => {
    const email = "recipient@example.com";
    const mailJetApiKeyPublic = "myApiKeyPublic";
    const mailJetApiKeyPrivate = "myApiKeyPrivate";
    const mailObject = "Test email";
    const mailContent = "This is a test email.";
    const mailJetSender = "sender@example.com";
    const mockError = new Error("Failed to send email");
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockRejectedValue(mockError),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    await expect(
      sendEmail({
        email,
        mailJetApiKeyPublic,
        mailJetApiKeyPrivate,
        mailObject,
        mailContent,
        mailJetSender,
      }),
    ).rejects.toThrow(mockError);
  });
});
