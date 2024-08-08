import fs from 'fs/promises';
import { IExec, utils } from 'iexec';
import { iexecOptions } from '../config/config.js';

export const getIExec = (privateKey: string): IExec => {
  const ethProvider = utils.getSignerFromPrivateKey(
    iexecOptions.rpcURL,
    privateKey
  );
  return new IExec(
    {
      ethProvider,
    },
    iexecOptions
  );
};

export const getDockerImageChecksum = async (
  namespace: string,
  repository: string,
  tag: string
): Promise<string> => {
  try {
    const manifest = await fetch(
      `https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags/${tag}`
    ).then((res) => res.json());
    const digest = manifest.digest as string;
    if (digest) {
      return digest.replace('sha256:', '0x');
    }
  } catch (err) {
    throw Error(
      `Error inspecting image ${namespace}/${repository}:${tag}: ${err}`
    );
  }
};

/**
 * read the scone fingerprint from previously generated `.scone-fingerprint`
 */
export const loadSconeFingerprint = async (): Promise<string> => {
  try {
    const fingerprint = await fs.readFile('.scone-fingerprint', 'utf8');
    return fingerprint.trim();
  } catch (err) {
    throw Error(`Error reading .scone-fingerprint: ${err}`);
  }
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
