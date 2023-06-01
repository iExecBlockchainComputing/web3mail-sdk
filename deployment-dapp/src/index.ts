import {
  DOCKER_IMAGE_NAMESPACE,
  DOCKER_IMAGE_REPOSITORY,
  DOCKER_IMAGE_PROD_TAG,
} from './config/config.js';
import { getDockerImageChecksum, getSconeFingerprint } from './utils/utils.js';

const main = async () => {
  const checksum = await getDockerImageChecksum(
    DOCKER_IMAGE_NAMESPACE,
    DOCKER_IMAGE_REPOSITORY,
    DOCKER_IMAGE_PROD_TAG
  );
  console.log('checksum: ', checksum);

  const fingerprint = await getSconeFingerprint();
  console.log('fingerprint: ', fingerprint);
};

main();
