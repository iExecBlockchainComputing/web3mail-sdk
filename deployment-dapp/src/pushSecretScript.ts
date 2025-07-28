import { pushSecret } from './singleFunction/pushSecret.js';
import { getIExec, loadAppAddress } from './utils/utils.js';

const main = async () => {
  const {
    RPC_URL,
    WALLET_PRIVATE_KEY,
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
    MAILGUN_APIKEY,
    WEB3MAIL_WHITELISTED_APPS,
    POCO_SUBGRAPH_URL,
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);
  if (!MJ_APIKEY_PUBLIC) throw Error('Missing env MJ_APIKEY_PUBLIC');
  if (!MJ_APIKEY_PRIVATE) throw Error('Missing env MJ_APIKEY_PRIVATE');
  if (!MJ_SENDER) throw Error('Missing env MJ_SENDER');
  if (!MAILGUN_APIKEY) throw Error('Missing env MAILGUN_APIKEY');
  if (WEB3MAIL_WHITELISTED_APPS === undefined)
    throw Error('Missing env WEB3MAIL_WHITELISTED_APPS');
  if (!POCO_SUBGRAPH_URL) throw Error('Missing env POCO_SUBGRAPH_URL');

  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);

  const appAddress = await loadAppAddress();

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  const fullWhitelistedApps = [
    ...new Set([...JSON.parse(WEB3MAIL_WHITELISTED_APPS), appAddress]),
  ];

  const jsonSecret = JSON.stringify({
    MJ_APIKEY_PUBLIC,
    MJ_APIKEY_PRIVATE,
    MJ_SENDER,
    MAILGUN_APIKEY,
    WEB3MAIL_WHITELISTED_APPS: JSON.stringify(fullWhitelistedApps),
    POCO_SUBGRAPH_URL,
  });

  await pushSecret(iexec, appAddress, jsonSecret);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
