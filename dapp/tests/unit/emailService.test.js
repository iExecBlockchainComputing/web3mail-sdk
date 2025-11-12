const Mailjet = require('node-mailjet');
const sendEmail = require('../../src/emailService');

describe('sendEmail', () => {
  it('sends an email successfully', async () => {
    const email = 'recipient@example.com';
    const mailJetApiKeyPublic = 'myApiKeyPublic';
    const mailJetApiKeyPrivate = 'myApiKeyPrivate';
    const emailSubject = 'Test email';
    const emailContent = 'This is a test email.';
    const mailJetSender = 'sender@example.com';
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockResolvedValue(),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    const response = await sendEmail({
      email,
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate,
      emailSubject,
      emailContent,
      mailJetSender,
    });

    expect(Mailjet.apiConnect).toHaveBeenCalledWith(
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate
    );
    expect(mockMailjet.post).toHaveBeenCalledWith('send', { version: 'v3.1' });
    expect(mockMailjet.request).toHaveBeenCalledWith({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: 'Web3mail',
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
    });
    expect(response).toBeUndefined();
  });

  it('sends an email with sender tag successfully', async () => {
    const email = 'recipient@example.com';
    const mailJetApiKeyPublic = 'myApiKeyPublic';
    const mailJetApiKeyPrivate = 'myApiKeyPrivate';
    const emailSubject = 'Test email';
    const emailContent = 'This is a test email.';
    const mailJetSender = 'sender@example.com';
    const senderName = 'Product Team';
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockResolvedValue(),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    const response = await sendEmail({
      email,
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate,
      emailSubject,
      emailContent,
      mailJetSender,
      senderName,
    });

    expect(Mailjet.apiConnect).toHaveBeenCalledWith(
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate
    );
    expect(mockMailjet.post).toHaveBeenCalledWith('send', { version: 'v3.1' });
    expect(mockMailjet.request).toHaveBeenCalledWith({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: 'Product Team via Web3mail',
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
    });
    expect(response).toBeUndefined();
  });

  it('sends an html email successfully', async () => {
    const email = 'recipient@example.com';
    const mailJetApiKeyPublic = 'myApiKeyPublic';
    const mailJetApiKeyPrivate = 'myApiKeyPrivate';
    const emailSubject = 'Test email';
    const emailContent = '<b>This is a test email.</b>';
    const mailJetSender = 'sender@example.com';
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockResolvedValue(),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    const response = await sendEmail({
      email,
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate,
      emailSubject,
      emailContent,
      mailJetSender,
      contentType: 'text/html',
    });

    expect(Mailjet.apiConnect).toHaveBeenCalledWith(
      mailJetApiKeyPublic,
      mailJetApiKeyPrivate
    );
    expect(mockMailjet.post).toHaveBeenCalledWith('send', { version: 'v3.1' });
    expect(mockMailjet.request).toHaveBeenCalledWith({
      Messages: [
        {
          From: {
            Email: mailJetSender,
            Name: 'Web3mail',
          },
          To: [
            {
              Email: email,
              Name: '',
            },
          ],
          Subject: emailSubject,
          HTMLPart: emailContent,
        },
      ],
    });
    expect(response).toBeUndefined();
  });

  it('throws an error if the email fails to send', async () => {
    const email = 'recipient@example.com';
    const mailJetApiKeyPublic = 'myApiKeyPublic';
    const mailJetApiKeyPrivate = 'myApiKeyPrivate';
    const emailSubject = 'Test email';
    const emailContent = 'This is a test email.';
    const mailJetSender = 'sender@example.com';
    const mockMailjet = {
      post: jest.fn().mockReturnThis(),
      request: jest.fn().mockRejectedValue(),
    };
    Mailjet.apiConnect = jest.fn().mockReturnValue(mockMailjet);

    await expect(
      sendEmail({
        email,
        mailJetApiKeyPublic,
        mailJetApiKeyPrivate,
        emailSubject,
        emailContent,
        mailJetSender,
      })
    ).rejects.toThrow(Error('Failed to send email'));
  });
});
