import { Bytes32, IExec, TeeFramework } from "iexec";
import { APP_NAME, APP_TYPE, DOCKER_IMAGE, FRAMEWORK } from "../config/config.js";

export const deployApp = async (
  iexec: IExec,
  walletAddress: string,
  checksum: Bytes32,
  fingerprint: string
): Promise<string> => {
  const owner = walletAddress.toLocaleLowerCase();
  const name = APP_NAME;
  const type = APP_TYPE;
  const multiaddr = DOCKER_IMAGE;
  const framework: TeeFramework = FRAMEWORK;
  const mrenclave = {
    framework: framework,
    version: "v5",
    entrypoint: "node /app/app.js",
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