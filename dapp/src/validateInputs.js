const Joi = require('joi');

const schema = Joi.object({
  iexecIn: Joi.string().required(),
  iexecOut: Joi.string().required(),
  dataFileName: Joi.string().required(),
  mailJetApiKeyPublic: Joi.string().required(),
  mailJetApiKeyPrivate: Joi.string().required(),
  mailJetSender: Joi.string().email().required(),
  mailObject: Joi.string().required(),
  mailContent: Joi.string().required(),
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
