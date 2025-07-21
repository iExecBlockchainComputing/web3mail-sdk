import { configureEnsName } from './singleFunction/configureEnsName.js';
import { getIExec, loadAppAddress } from './utils/utils.js';

const main = async () => {
  const { RPC_URL, WALLET_PRIVATE_KEY, DAPP_ENS_NAME } = process.env;

  const appAddress = await loadAppAddress();

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Failed to get privateKey from environment variables`);

  if (!DAPP_ENS_NAME)
    throw Error(`Failed to get DAPP_ENS_NAME from environment variables`);

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);
  await configureEnsName(iexec, appAddress, DAPP_ENS_NAME);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
