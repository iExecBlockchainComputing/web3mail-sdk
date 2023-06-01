import { readFileSync } from 'fs';

//hosting url
export const HOST = 'https://bellecour.iex.ec';
export const HOST_SMS_DEBUG_SCONE =
  'https://sms.scone-debug.v8-bellecour.iex.ec';
export const HOST_SMS_DEBUG_GRAMINE = 'https://sms.gramine.v8-bellecour.iex.ec';

//deployment parameters
export const APP_NAME = 'web3Mail';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const APP_PRICE = 0;
export const APP_VOLUME = 1000;
export const APP_TAG = ['tee', 'scone'];

//ENS name
export const WEB3_MAIL_ENS_NAME_DEV = 'web3mail-dev.apps.iexec.eth';
export const WEB3_MAIL_ENS_NAME_PROD = 'web3mail.apps.iexec.eth';

//secret parameters
export const MJ_SENDER = 'web3mail@iex.ec';

// image
const SCONIFIER_VERSION = '5.7.5-v9';
const dappVersion = JSON.parse(
  readFileSync('../dapp/package.json', 'utf-8')
).version;

export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'web3mail-dapp';
export const DOCKER_IMAGE_PROD_TAG = `${dappVersion}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}-sconify-${SCONIFIER_VERSION}-production`;

//drone target
export const DRONE_TARGET_DEPLOY_DEV = 'dapp-dev';
export const DRONE_TARGET_DEPLOY_PROD = 'dapp-production';
export const DRONE_TARGET_SELL_ORDER_DEV = 'dapp-sell-order-dev';
export const DRONE_TARGET_SELL_ORDER_PROD = 'dapp-sell-order-production';
