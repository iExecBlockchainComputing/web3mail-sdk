import {
  initIexecConstructorDev,
  initIexecConstructorProd,
} from './singleFunction/initConstructor';
import { publishSellOrder } from './singleFunction/publishSellOrder';
import { resolveName } from './singleFunction/resolveName';
import {
  WEB3_MAIL_ENS_NAME_DEV,
  WEB3_MAIL_ENS_NAME_PROD,
} from './config/config';

const main = async () => {
  // get env variables from drone secret
  const droneTarget = process.env.DRONE_DEPLOY_TO;
  const walletAddressDev = process.env.WALLET_ADDRESS_DEV;
  const walletPrivateKeyDev = process.env.WALLET_PRIVATE_KEY_DEV;
  const walletAddressProd = process.env.WALLET_ADDRESS_PROD;
  const walletPrivateKeyProd = process.env.WALLET_PRIVATE_KEY_PROD;
  const mjPublicKey = process.env.MJ_API_KEY_PUBLIC;
  const mjPrivateKey = process.env.MJ_API_KEY_PRIVATE;

  //chose correct env variables
  let chosenWalletAddress;
  let chosenPrivateKey;
  let chosenEnsName;
  if (droneTarget === 'dev') {
    chosenWalletAddress = walletAddressDev;
    chosenPrivateKey = walletPrivateKeyDev;
    chosenEnsName = WEB3_MAIL_ENS_NAME_DEV;
  } else if (droneTarget === 'production') {
    chosenWalletAddress = walletAddressProd;
    chosenPrivateKey = walletPrivateKeyProd;
    chosenEnsName = WEB3_MAIL_ENS_NAME_PROD;
  }

  if (
    !chosenWalletAddress ||
    !chosenPrivateKey ||
    !chosenEnsName ||
    !mjPublicKey ||
    !mjPrivateKey ||
    !droneTarget
  )
    return; // If one of secret requiered secret is not set, do not continue

  //init iexec library
  let iexec;
  if (droneTarget === 'dev') {
    iexec = await initIexecConstructorDev(chosenWalletAddress);
  } else if (droneTarget === 'production') {
    iexec = await initIexecConstructorProd(chosenPrivateKey);
  }

  if (!iexec) return; // If iexec library was not init, do not continue

  //resolve app ENS name
  const appAddress = await resolveName(iexec, chosenEnsName);

  if (!appAddress) return; // If the app was not deployed, do not continue

  //publish sell order for Tee app (scone)
  await publishSellOrder(iexec, appAddress);
};

main();
