const fetch = require('node-fetch');

async function validateEmailAddress({ emailAddress, mailgunApiKey }) {
  const basicAuth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');

  try {
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
      console.warn('Mailgun API did not respond properly (non-2xx). Skipping.');
      return undefined;
    }

    const json = await response.json();
    return json.result === 'deliverable';
  } catch (e) {
    console.warn('Mailgun API request failed:', e.message);
    return undefined;
  }
}

module.exports = {
  validateEmailAddress,
};
