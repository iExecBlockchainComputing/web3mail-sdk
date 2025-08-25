const fetch = require('node-fetch');

async function validateEmailAddress({ emailAddress, mailgunApiKey }) {
  // Optimisation : créer le Basic Auth directement sans buffer temporaire
  let basicAuth = `api:${mailgunApiKey}`;
  let encodedAuth = Buffer.from(basicAuth).toString('base64');

  try {
    const response = await fetch(
      `https://api.mailgun.net/v4/address/validate?address=${encodeURIComponent(
        emailAddress
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${encodedAuth}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('Mailgun API did not respond properly (non-2xx). Skipping.');
      return undefined;
    }

    let json = await response.json();
    const result = json.result === 'deliverable';

    // Libérer la mémoire
    json = null;

    return result;
  } catch (e) {
    console.warn('Mailgun API request failed:', e.message);
    return undefined;
  } finally {
    // Libérer la mémoire
    basicAuth = null;
    encodedAuth = null;
  }
}

module.exports = {
  validateEmailAddress,
};
