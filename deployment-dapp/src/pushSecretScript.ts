import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
} from './config/config.js';
import { getIExec, loadAppAddress } from './utils/utils.js';
import { pushSecret } from './singleFunction/pushSecret.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    (DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_PROD)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  if (!MJ_APIKEY_PUBLIC) throw Error('Missing env MJ_APIKEY_PUBLIC');
  if (!MJ_APIKEY_PRIVATE) throw Error('Missing env MJ_APIKEY_PRIVATE');
  if (!MJ_SENDER) throw Error('Missing env MJ_SENDER');

  const appAddress = await loadAppAddress();

  let privateKey;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  //deploy app
  //push app secret to the secret management
  const jsonSecret = JSON.stringify({
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
  });
  await pushSecret(iexec, appAddress, jsonSecret);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
