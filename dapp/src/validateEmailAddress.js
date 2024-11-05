// fetch is not included in node 14
const fetch = require('node-fetch');

async function validateEmailAddress({ emailAddress, mailgunApiKey }) {
  // https://documentation.mailgun.com/docs/inboxready/mailgun-validate/single-valid-ir/#single-validation
  const basicAuth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');
  const response = await fetch(
    `https://api.mailgun.net/v4/address/validate?address=${encodeURIComponent(
      emailAddress
    )}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  if (!response.ok) {
    // Mailgun API down? Prefer not to throw
    return;
  }

  const emailAddressSeemsLegit = await response.json();

  if (emailAddressSeemsLegit.result !== 'deliverable') {
    throw new Error('The protected email address seems to be invalid.');
  }
}

module.exports = {
  validateEmailAddress,
};
