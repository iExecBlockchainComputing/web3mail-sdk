import { deployApp } from './singleFunction/deployApp.js';
import { getIExec, saveAppAddress } from './utils/utils.js';

const main = async () => {
  // get env variables from GitHub Actions
  const {
    RPC_URL,
    WALLET_PRIVATE_KEY,
    DOCKER_IMAGE_TAG,
    CHECKSUM,
    FINGERPRINT,
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);

  if (!DOCKER_IMAGE_TAG) {
    throw Error(`Missing DOCKER_IMAGE_TAG environment variable.`);
  }

  const address = await deployApp({
    iexec,
    dockerTag: DOCKER_IMAGE_TAG,
    checksum: CHECKSUM,
    fingerprint: FINGERPRINT,
  });
  await saveAppAddress(address);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
