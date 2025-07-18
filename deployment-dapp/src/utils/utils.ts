import fs from 'fs/promises';
import { IExec, utils } from 'iexec';

export const getIExec = (
  privateKey: string,
  host: string = 'bellecour'
): IExec => {
  const ethProvider = utils.getSignerFromPrivateKey(host, privateKey, {
    providers: {},
    allowExperimentalNetworks: true,
  });
  return new IExec({
    ethProvider,
  }, {
    allowExperimentalNetworks: true,
  });
};

const APP_ADDRESS_FILE = '.app-address';
/**
 * save the app address in `.app-address` file for next usages
 */
export const saveAppAddress = async (address: string) =>
  fs.writeFile(APP_ADDRESS_FILE, address);
/**
 * read the app address from previously generated `.appAddress`
 */
export const loadAppAddress = async () => {
  try {
    const fingerprint = await fs.readFile(APP_ADDRESS_FILE, 'utf8');
    return fingerprint.trim();
  } catch (err) {
    throw Error(`Error reading .app-address: ${err}`);
  }
};
