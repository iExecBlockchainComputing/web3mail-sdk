import { getIExec } from './utils/utils.js';
import { publishSellOrder } from './singleFunction/publishSellOrder.js';
import { resolveName } from './singleFunction/resolveName.js';
import {
  DRONE_TARGET_SELL_ORDER_DEV,
  DRONE_TARGET_SELL_ORDER_PROD,
  WEB3_MAIL_ENS_NAME_DEV,
  WEB3_MAIL_ENS_NAME_PROD,
} from './config/config.js';

const main = async () => {
  // get env variables from drone secret
  const droneTarget = process.env.DRONE_DEPLOY_TO;
  const walletAddressDev = process.env.WALLET_ADDRESS_DEV;
  const walletPrivateKeyDev = process.env.WALLET_PRIVATE_KEY_DEV;
  const walletAddressProd = process.env.WALLET_ADDRESS_PROD;
  const walletPrivateKeyProd = process.env.WALLET_PRIVATE_KEY_PROD;

  if (!droneTarget)
    return console.log("STEP: Didn't succeed to get drone target"); // If drone target is not set, do not continue

  //chose correct env variables
  let chosenWalletAddress;
  let chosenPrivateKey;
  let chosenEnsName;
  if (droneTarget === DRONE_TARGET_SELL_ORDER_DEV) {
    chosenWalletAddress = walletAddressDev;
    chosenPrivateKey = walletPrivateKeyDev;
    chosenEnsName = WEB3_MAIL_ENS_NAME_DEV;
  } else if (droneTarget === DRONE_TARGET_SELL_ORDER_PROD) {
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

  //init iexec library
  const iexec = getIExec(chosenPrivateKey);
  if (!iexec) return console.log("STEP: Didn't succeed to init iexec"); // If iexec library was not init, do not continue

  //resolve app ENS name
  const appAddress = await resolveName(iexec, chosenEnsName);

  if (!appAddress)
    return console.log("STEP: Didn't succeed to deploy App contract"); // If the app was not deployed, do not continue

  //publish sell order for Tee app (scone)
  await publishSellOrder(iexec, appAddress);
};

main();
