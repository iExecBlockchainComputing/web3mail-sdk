const Joi = require('joi');

const schema = Joi.object({
  iexecIn: Joi.string().required(),
  iexecOut: Joi.string().required(),
  dataFileName: Joi.string().required(),
  mailJetApiKeyPublic: Joi.string().required(),
  mailJetApiKeyPrivate: Joi.string().required(),
  mailJetSender: Joi.string().email().required(),
  emailSubject: Joi.string().required(),
  emailContent: Joi.string().required(),
  contentType: Joi.string().valid('text/plain', 'text/html'),
  senderTag: Joi.string().min(3).max(20),
});

function validateInputs(envVars) {
  const { error, value } = schema.validate(envVars, { abortEarly: false });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(validationErrors.join('; '));
  }
  return value;
}

module.exports = validateInputs;
