import { deployApp } from './singleFunction/deployApp.js';
import {
  DOCKER_IMAGE_DEV_TAG,
  DOCKER_IMAGE_PROD_TAG,
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
} from './config/config.js';
import { getIExec, saveAppAddress } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const { DRONE_DEPLOY_TO, WALLET_PRIVATE_KEY_DEV, WALLET_PRIVATE_KEY_PROD } =
    process.env;

  if (
    !DRONE_DEPLOY_TO ||
    (DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_PROD)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  let dockerImageTag;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
    dockerImageTag = DOCKER_IMAGE_DEV_TAG;
  } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    dockerImageTag = DOCKER_IMAGE_PROD_TAG;
  }

  //deploy app
  const address = await deployApp({
    iexec,
    dockerTag: dockerImageTag,
  });
  await saveAppAddress(address);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
