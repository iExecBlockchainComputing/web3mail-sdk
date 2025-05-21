import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  DRONE_TARGET_PUSH_SECRET_DEV,
  DRONE_TARGET_PUSH_SECRET_PROD,
  WEB3_MAIL_ENS_NAME_DEV,
  WEB3_MAIL_ENS_NAME_PROD,
  WEB3MAIL_WHITELISTED_APPS_DEV,
  WEB3MAIL_WHITELISTED_APPS_PROD,
} from './config/config.js';
import { pushSecret } from './singleFunction/pushSecret.js';
import { resolveName } from './singleFunction/resolveName.js';
import { getIExec, loadAppAddress } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
    MAILGUN_APIKEY,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    ![
      DRONE_TARGET_DEPLOY_DEV,
      DRONE_TARGET_DEPLOY_PROD,
      DRONE_TARGET_PUSH_SECRET_DEV,
      DRONE_TARGET_PUSH_SECRET_PROD,
    ].includes(DRONE_DEPLOY_TO)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  if (!MJ_APIKEY_PUBLIC) throw Error('Missing env MJ_APIKEY_PUBLIC');
  if (!MJ_APIKEY_PRIVATE) throw Error('Missing env MJ_APIKEY_PRIVATE');
  if (!MJ_SENDER) throw Error('Missing env MJ_SENDER');
  if (!MAILGUN_APIKEY) throw Error('Missing env MAILGUN_APIKEY');

  let privateKey;
  let baseWhitelistedApps;

  if (
    DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV ||
    DRONE_DEPLOY_TO === DRONE_TARGET_PUSH_SECRET_DEV
  ) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
    baseWhitelistedApps = JSON.parse(WEB3MAIL_WHITELISTED_APPS_DEV);
  } else if (
    DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD ||
    DRONE_DEPLOY_TO === DRONE_TARGET_PUSH_SECRET_PROD
  ) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
    baseWhitelistedApps = JSON.parse(WEB3MAIL_WHITELISTED_APPS_PROD);
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  let appAddress = await loadAppAddress().catch(() => {
    console.log('No app address found falling back to ENS');
    let ensName;
    if (DRONE_DEPLOY_TO === DRONE_TARGET_PUSH_SECRET_DEV) {
      ensName = WEB3_MAIL_ENS_NAME_DEV;
    } else if (DRONE_DEPLOY_TO === DRONE_TARGET_PUSH_SECRET_PROD) {
      ensName = WEB3_MAIL_ENS_NAME_PROD;
    }
    if (!ensName)
      throw Error(`Failed to get ens name for target ${DRONE_DEPLOY_TO}`);
    return resolveName(iexec, ensName);
  });

  appAddress = '0x32788862f29e0807a98b8c085d84d8d02b5c567c';
  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue
  const fullWhitelistedApps = [
    ...new Set([...baseWhitelistedApps, appAddress]),
  ];
  //deploy app
  //push app secret to the secret management
  const jsonSecret = JSON.stringify({
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
    MAILGUN_APIKEY,
    WEB3MAIL_WHITELISTED_APPS: JSON.stringify(fullWhitelistedApps),
  });

  await pushSecret(iexec, appAddress, jsonSecret);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
