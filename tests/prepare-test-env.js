import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

async function prepareTestEnv() {
  try {
    const forkUrl =
      process.env.BELLECOUR_FORK_URL || 'https://bellecour.iex.ec';
    const response = await fetch(forkUrl, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    const jsonRes = await response.json();
    const forkBlockNumber = parseInt(jsonRes.result.substring(2), 16);

    if (process.env.DRONE) {
      const LOCAL_STACK_ENV_DIR = 'local-stack-env';
      console.log(
        `Creating ${LOCAL_STACK_ENV_DIR} directory for drone test-stack`
      );
      mkdirSync(LOCAL_STACK_ENV_DIR, { recursive: true });
      writeFileSync(join(LOCAL_STACK_ENV_DIR, 'BELLECOUR_FORK_URL'), forkUrl);
      writeFileSync(
        join(LOCAL_STACK_ENV_DIR, 'BELLECOUR_FORK_BLOCK'),
        `${forkBlockNumber}`
      );
    } else {
      console.log('Creating .env file for docker-compose test-stack');
      writeFileSync('.env', generateEnvFileContent(forkUrl, forkBlockNumber));
    }
  } catch (error) {
    throw new Error(
      `Failed to get current block number from ${process.env.BELLECOUR_FORK_URL}: ${error}`
    );
  }
}

function generateEnvFileContent(forkUrl, forkBlockNumber) {
  const FORK_URL_ENV = `BELLECOUR_FORK_URL=${forkUrl}`;
  const FORK_BLOCK_ENV = `BELLECOUR_FORK_BLOCK=${forkBlockNumber}`;

  return (
    `############ THIS FILE IS GENERATED ############\n` +
    `# run "node prepare-test-env.js" to regenerate #\n` +
    `################################################\n\n` +
    `# blockchain node to use as the reference for the local fork\n` +
    `${FORK_URL_ENV}\n` +
    `# block number to fork from\n` +
    `${FORK_BLOCK_ENV}`
  );
}

prepareTestEnv();
