async function validateEmailAddress({ emailAddress, mailgunApiKey }) {
  const response = await fetch(
    `https://api.mailgun.net/v4/address/validate?address=${encodeURIComponent(
      emailAddress
    )}`,
    {
      method: 'GET',
      headers: {
        // eslint-disable-next-line prefer-template
        Authorization: 'Basic ' + btoa(`api:${mailgunApiKey}`),
      },
    }
  );

  if (!response.ok) {
    // Mailgun API down? Prefer not to throw
    return;
  }

  const emailAddressSeemsLegit = await response.json();

  if (emailAddressSeemsLegit.result !== 'deliverable') {
    throw new Error(
      'Oops, this email address seems to be invalid, please enter another one.'
    );
  }
}

module.exports = {
  validateEmailAddress,
};
