const fetch = require('node-fetch');

async function validateEmailAddress({ emailAddress, bouncerApiKey }) {
  try {
    const response = await fetch(
      `https://api.usebouncer.com/v1.1/email/verify?email=${encodeURIComponent(
        emailAddress
      )}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': bouncerApiKey,
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `Bouncer API did not respond properly (status ${response.status}). Skipping.`
      );
      return undefined;
    }

    const json = await response.json();
    switch (json.status) {
      case 'deliverable':
        return true;
      case 'undeliverable':
      case 'risky':
        return false;
      default:
        // "unknown" (timeout, dns_error, unavailable_smtp...) is inconclusive
        console.warn(
          `Bouncer API returned an inconclusive status (${json.status}, reason: ${json.reason}). Skipping.`
        );
        return undefined;
    }
  } catch (e) {
    console.warn('Bouncer API request failed:', e.message);
    return undefined;
  }
}

module.exports = {
  validateEmailAddress,
};
