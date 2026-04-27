import { IExec } from 'iexec';
import {
  APP_NAME,
  APP_TYPE,
  DOCKER_IMAGE_NAMESPACE,
  DOCKER_IMAGE_REPOSITORY,
} from '../config/config.js';

export const deployApp = async ({
  iexec,
  dockerNamespace = DOCKER_IMAGE_NAMESPACE,
  dockerRepository = DOCKER_IMAGE_REPOSITORY,
  dockerTag,
  checksum,
  // TODO: to be deleted after migration to TDX
  fingerprint,
  sconifyVersion,
}: {
  iexec: IExec;
  dockerNamespace?: string;
  dockerRepository?: string;
  dockerTag: string;
  checksum?: string;
  // TODO: to be deleted after migration to TDX
  fingerprint?: string;
  sconifyVersion?: string;
}): Promise<string> => {
  const name = APP_NAME;
  const type = APP_TYPE;

  const app = {
    owner: await iexec.wallet.getAddress(),
    name,
    type,
    multiaddr: `${dockerNamespace}/${dockerRepository}:${dockerTag}`,
    checksum,
  };
  console.log(`Deploying app:\n${JSON.stringify(app, undefined, 2)}`);
  const { address, txHash } = await iexec.app.deployApp(app);
  console.log(`Deployed app at ${address} (tx: ${txHash})`);
  return address;
};
