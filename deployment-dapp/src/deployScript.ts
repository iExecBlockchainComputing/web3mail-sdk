import { configureEnsName } from './singleFunction/configureEnsName.js';
import { deployApp } from './singleFunction/deployApp.js';
import { publishSellOrder } from './singleFunction/publishSellOrder.js';
import { pushSecret } from './singleFunction/pushSecret.js';
import {
  DOCKER_IMAGE_DEV_TAG,
  DOCKER_IMAGE_NAMESPACE,
  DOCKER_IMAGE_PROD_TAG,
  DOCKER_IMAGE_REPOSITORY,
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  MJ_SENDER,
  WEB3_MAIL_ENS_NAME_DEV,
  WEB3_MAIL_ENS_NAME_PROD,
} from './config/config.js';
import {
  getDockerImageChecksum,
  getSconeFingerprint,
  getIExec,
} from './utils/utils.js';

const main = async () => {
  // get env variables from drone secret
  const droneTarget = process.env.DRONE_DEPLOY_TO;
  const walletAddressDev = process.env.WALLET_ADDRESS_DEV;
  const walletPrivateKeyDev = process.env.WALLET_PRIVATE_KEY_DEV;
  const walletAddressProd = process.env.WALLET_ADDRESS_PROD;
  const walletPrivateKeyProd = process.env.WALLET_PRIVATE_KEY_PROD;
  const mjPublicKey = process.env.MJ_API_KEY_PUBLIC;
  const mjPrivateKey = process.env.MJ_API_KEY_PRIVATE;

  if (!droneTarget)
    return console.log("STEP: Didn't succeed to get drone target"); // If drone target is not set, do not continue
  if (!mjPublicKey)
    return console.log("STEP: Didn't succeed to get mailjet public key"); // If mailjet public key is not set, do not continue
  if (!mjPrivateKey)
    return console.log("STEP: Didn't succeed to get mailjet private key"); // If mailjet private key is not set, do not continue

  //chose correct env variables
  let chosenWalletAddress;
  let chosenPrivateKey;
  let chosenEnsName;
  if (droneTarget === DRONE_TARGET_DEPLOY_DEV) {
    chosenWalletAddress = walletAddressDev;
    chosenPrivateKey = walletPrivateKeyDev;
    chosenEnsName = WEB3_MAIL_ENS_NAME_DEV;
  } else if (droneTarget === DRONE_TARGET_DEPLOY_PROD) {
    chosenWalletAddress = walletAddressProd;
    chosenPrivateKey = walletPrivateKeyProd;
    chosenEnsName = WEB3_MAIL_ENS_NAME_PROD;
  }

  if (!chosenWalletAddress)
    return console.log("STEP: Didn't succeed to get wallet address"); // If wallet address is not set, do not continue
  if (!chosenPrivateKey)
    return console.log("STEP: Didn't succeed to get wallet private key"); // If wallet private key is not set, do not continue
  if (!chosenEnsName)
    return console.log("STEP: Didn't succeed to get ens name"); // If ens name is not set, do not continue

  const iexec = getIExec(chosenPrivateKey);
  if (!iexec) return console.log("STEP: Didn't succeed to init iexec"); // If iexec library was not init, do not continue

  let dockerImageTag;
  if (droneTarget === DRONE_TARGET_DEPLOY_DEV) {
    dockerImageTag = DOCKER_IMAGE_DEV_TAG;
  } else if (droneTarget === DRONE_TARGET_DEPLOY_PROD) {
    dockerImageTag = DOCKER_IMAGE_PROD_TAG;
  }

  //get checksum of the docker image from docker hub
  let checksum;
  try {
    checksum = await getDockerImageChecksum(
      DOCKER_IMAGE_NAMESPACE,
      DOCKER_IMAGE_REPOSITORY,
      dockerImageTag
    );
  } catch (error) {
    console.log(error);
  }

  if (!checksum) return console.log("STEP: Didn't succeed to get checksum"); // If checksum is not set, do not continue

  //get fingerprint of the docker image from docker hub
  let fingerprint;
  try {
    fingerprint = await getSconeFingerprint();
  } catch (error) {
    console.log(error);
  }

  if (!fingerprint)
    return console.log("STEP: Didn't succeed to get fingerprint"); // If fingerprint is not set, do not continue

  //deploy app
  const appAddress = await deployApp({
    iexec: iexec,
    owner: chosenWalletAddress,
    multiaddr: `${DOCKER_IMAGE_NAMESPACE}/${DOCKER_IMAGE_REPOSITORY}:${dockerImageTag}`,
    checksum,
    fingerprint,
  });

  if (!appAddress)
    return console.log("STEP: Didn't succeed to deploy App contract"); // If the app was not deployed, do not continue

  //push app secret to the secret management
  const jsonSecret = {
    MJ_API_KEY_PUBLIC: mjPublicKey,
    MJ_API_KEY_PRIVATE: mjPrivateKey,
    MJ_SENDER: MJ_SENDER,
  };
  const stringSecret = JSON.stringify(jsonSecret);
  const isPushed = await pushSecret(iexec, appAddress, stringSecret);

  if (!isPushed) return console.log("STEP: Didn't succeed to push secret"); // If the secret was not pushed, do not continue

  //set ENS name for the app web3mail
  await configureEnsName(iexec, appAddress, chosenEnsName);

  //publish sell order for Tee app (scone)
  await publishSellOrder(iexec, appAddress);
};

main();
