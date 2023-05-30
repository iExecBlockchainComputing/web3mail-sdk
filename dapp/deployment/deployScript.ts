// import { configureEnsName } from './singleFunction/configureEnsName.js';
// import { deployApp } from './singleFunction/deployApp.js';
// import {
//   initIexecConstructorDev,
//   initIexecConstructorProd,
// } from './singleFunction/initConstructor.js';
// import { publishSellOrder } from './singleFunction/publishSellOrder.js';
// import { pushSecret } from './singleFunction/pushSecret.js';
// import {
//   DRONE_TARGET_DEV,
//   DRONE_TARGET_PROD,
//   MJ_SENDER,
//   WEB3_MAIL_ENS_NAME_DEV,
//   WEB3_MAIL_ENS_NAME_PROD,
// } from './config/config.js';
// import {
//   getDockerImageChecksum,
//   getFingerprintFromScone,
// } from './utils/utils.js';

// const main = async () => {
//   // get env variables from drone secret
//   const droneTarget = process.env.DRONE_DEPLOY_TO;
//   const walletAddressDev = process.env.WALLET_ADDRESS_DEV;
//   const walletPrivateKeyDev = process.env.WALLET_PRIVATE_KEY_DEV;
//   const walletAddressProd = process.env.WALLET_ADDRESS_PROD;
//   const walletPrivateKeyProd = process.env.WALLET_PRIVATE_KEY_PROD;
//   const mjPublicKey = process.env.MJ_API_KEY_PUBLIC;
//   const mjPrivateKey = process.env.MJ_API_KEY_PRIVATE;

//   //chose correct env variables
//   let chosenWalletAddress;
//   let chosenPrivateKey;
//   let chosenEnsName;
//   if (droneTarget === 'dev') {
//     chosenWalletAddress = walletAddressDev;
//     chosenPrivateKey = walletPrivateKeyDev;
//     chosenEnsName = WEB3_MAIL_ENS_NAME_DEV;
//   } else if (droneTarget === 'production') {
//     chosenWalletAddress = walletAddressProd;
//     chosenPrivateKey = walletPrivateKeyProd;
//     chosenEnsName = WEB3_MAIL_ENS_NAME_PROD;
//   }

//   if (
//     !chosenWalletAddress ||
//     !chosenPrivateKey ||
//     !chosenEnsName ||
//     !mjPublicKey ||
//     !mjPrivateKey ||
//     !droneTarget
//   )
//     return; // If one of secret requiered secret is not set, do not continue

//   //init iexec library
//   let iexec;
//   if (droneTarget === DRONE_TARGET_DEV) {
//     iexec = await initIexecConstructorDev(chosenWalletAddress);
//   } else if (droneTarget === DRONE_TARGET_PROD) {
//     iexec = await initIexecConstructorProd(chosenWalletAddress);
//   }

//   if (!iexec) return; // If iexec library was not init, do not continue

//   //get checksum of the docker image from docker hub
//   let checksum;
//   try {
//     checksum = await getDockerImageChecksum();
//   } catch (error) {
//     console.log(error);
//   }

//   //get fingerprint of the docker image from docker hub
//   let fingerprint;
//   try {
//     fingerprint = await getFingerprintFromScone();
//   } catch (error) {
//     console.log(error);
//   }

//   if (!checksum || !fingerprint) return; // If checksum or fingerprint is not set, do not continue

//   //deploy app
//   const appAddress = await deployApp(
//     iexec,
//     chosenWalletAddress,
//     checksum,
//     fingerprint
//   );

//   if (!appAddress) return; // If the app was not deployed, do not continue

//   //push app secret to the secret management
//   const jsonSecret = {
//     MJ_API_KEY_PUBLIC: mjPublicKey,
//     MJ_API_KEY_PRIVATE: mjPrivateKey,
//     MJ_SENDER: MJ_SENDER,
//   };
//   const stringSecret = JSON.stringify(jsonSecret);
//   const isPushed = await pushSecret(iexec, appAddress, stringSecret);

//   if (!isPushed) return; // If the secret was not pushed, do not continue

//   //set ENS name for the app web3mail
//   await configureEnsName(iexec, appAddress, chosenEnsName);

//   //publish sell order for Tee app (scone)
//   await publishSellOrder(iexec, appAddress);
// };

// main();
import { IExec } from 'iexec';
console.log('Hello world', IExec);
