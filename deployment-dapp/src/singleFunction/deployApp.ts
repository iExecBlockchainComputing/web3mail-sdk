import { Bytes32, IExec, TeeFramework } from 'iexec';
import { APP_NAME, APP_TYPE, FRAMEWORK } from '../config/config.js';

export const deployApp = async ({
  iexec,
  owner,
  multiaddr,
  checksum,
  fingerprint,
}: {
  iexec: IExec;
  owner: string;
  multiaddr: string;
  checksum: Bytes32;
  fingerprint: string;
}): Promise<string> => {
  const name = APP_NAME;
  const type = APP_TYPE;
  const framework: TeeFramework = FRAMEWORK;
  const mrenclave = {
    framework: framework,
    version: 'v5',
    entrypoint: 'node /app/app.js',
    heapSize: 1073741824,
    fingerprint: fingerprint,
  };
  const deployResult = await iexec.app.deployApp({
    owner,
    name,
    type,
    multiaddr,
    checksum,
    mrenclave,
  });
  return deployResult.address;
};
