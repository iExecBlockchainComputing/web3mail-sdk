import {
  getDockerImageChecksum,
  getFingerprintFromScone,
} from './utils/utils.js';

const main = async () => {
  const checksum = await getDockerImageChecksum();
  console.log('checksum: ', checksum);

  const fingerprint = await getFingerprintFromScone();
  console.log('fingerprint: ', fingerprint);
};

main();

// A4d0a8b488ad30b1a333e3bf7a248d31122222ae731aa95cf35f5f159b52c2764
// 4d0a8b488ad30b1a333e3bf7a248d31122222ae731aa95cf35f5f159b52c2764
