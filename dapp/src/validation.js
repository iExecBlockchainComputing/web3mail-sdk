const Joi = require('joi');

const workerEnvSchema = Joi.object({
  IEXEC_OUT: Joi.string().required(),
});

function validateWorkerEnv(envVars) {
  const { error, value } = workerEnvSchema.validate(envVars, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`Worker environment error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const appSecretSchema = Joi.object({
  MJ_APIKEY_PUBLIC: Joi.string().required(),
  MJ_APIKEY_PRIVATE: Joi.string().required(),
  MJ_SENDER: Joi.string().email().required(),
  MAILGUN_APIKEY: Joi.string().required(),
  WEB3MAIL_WHITELISTED_APPS: Joi.array().items(Joi.string()).required(),
});

function validateAppSecret(obj) {
  const { error, value } = appSecretSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`App secret error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const protectedDataEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

function validateProtectedData(obj) {
  const { error, value } = protectedDataEmailSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`ProtectedData error: ${validationErrors.join('; ')}`);
  }
  return value;
}

const requesterSecretSchema = Joi.object({
  emailSubject: Joi.string().required(),
  emailContentMultiAddr: Joi.string()
    .pattern(/^\/(ipfs|p2p)\//)
    .message('"emailContentMultiAddr" must be a multiAddr')
    .required(),
  emailContentEncryptionKey: Joi.string().base64(),
  contentType: Joi.string().valid('text/plain', 'text/html'),
  senderName: Joi.string().min(3).max(20),
});

function validateRequesterSecret(obj) {
  const { error, value } = requesterSecretSchema.validate(obj, {
    abortEarly: false,
  });
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    throw new Error(`Requester secret error: ${validationErrors.join('; ')}`);
  }
  return value;
}

module.exports = {
  validateWorkerEnv,
  validateAppSecret,
  validateRequesterSecret,
  validateProtectedData,
};
