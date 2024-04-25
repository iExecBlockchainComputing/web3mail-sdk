import { Wallet } from 'ethers';
import {
  Web3MailConfigOptions,
  Web3SignerProvider,
} from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import { AppDeploymentArgs } from 'iexec/IExecAppModule';

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

export const getTestWeb3SignerProvider = (
  privateKey: string
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(
    process.env.DRONE ? 'http://bellecour-fork:8545' : 'http://127.0.0.1:8545',
    privateKey
  );

export const getTestIExecOption = () => ({
  smsURL: process.env.DRONE ? 'http://sms:13300' : 'http://127.0.0.1:13300',
  resultProxyURL: process.env.DRONE
    ? 'http://result-proxy:13200'
    : 'http://127.0.0.1:13200',
  iexecGatewayURL: process.env.DRONE
    ? 'http://market-api:3000'
    : 'http://127.0.0.1:3000',
});

export const getTestConfig = (
  privateKey: string
): [Web3SignerProvider, Web3MailConfigOptions] => {
  const ethProvider = getTestWeb3SignerProvider(privateKey);
  const options = {
    iexecOptions: getTestIExecOption(),
    ipfsGateway: process.env.DRONE
      ? 'http://ipfs:8080'
      : 'http://127.0.0.1:8080',
    ipfsNode: process.env.DRONE ? 'http://ipfs:5001' : 'http://127.0.0.1:5001',
    dataProtectorSubgraph: process.env.DRONE
      ? 'http://graphnode:8000/subgraphs/name/DataProtector'
      : 'http://127.0.0.1:8000/subgraphs/name/DataProtector',
  };
  return [ethProvider, options];
};

export const getId = () => randomInt(0, 1000000);

export const deployRandomDataset = async (iexec: IExec, owner?: string) =>
  iexec.dataset.deployDataset({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `dataset${getId()}`,
    multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    checksum:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

const WEB3MAIL_APP_DEPLOYMENT_ARGS: AppDeploymentArgs = {
  owner: undefined,
  name: 'local-web3mail-dapp',
  type: 'DOCKER',
  multiaddr: 'iexechub/web3mail-dapp:0.6.0-sconify-5.7.5-v12-production',
  mrenclave: {
    framework: 'SCONE',
    entrypoint: 'node /app/app.js',
    heapSize: 1073741824,
    version: 'v5',
    fingerprint:
      'da3f671e5e0fd0d8ac9d1ab781640685e5ae221bc97bd214d7b9fe1b832269b9',
  },
  checksum:
    '0xedfc15db004eeed1d0a952bc302c1106892a69535f7c196748621cb89ae9baae',
};

export const deployTestApp = async (
  iexec: IExec,
  appArgs: AppDeploymentArgs = WEB3MAIL_APP_DEPLOYMENT_ARGS
) => {
  const { name, type, multiaddr, mrenclave, checksum } = appArgs;
  const dappOwner = await iexec.wallet.getAddress();
  const { address } = await iexec.app.deployApp({
    owner: dappOwner,
    name,
    type,
    multiaddr,
    mrenclave,
    checksum,
  });
  return address;
};

export const deployTestWorkerpool = async (iexec: IExec) => {
  const workerpoolOwner = await iexec.wallet.getAddress();
  const { address } = await iexec.workerpool.deployWorkerpool({
    owner: workerpoolOwner,
    description: 'test workerpool',
  });
  return address;
};

export const createAndPublishTestOrders = async (
  resourceProvider,
  appAddress,
  workerpoolAddress
) => {
  // create & publish app order
  await resourceProvider.order
    .createApporder({
      app: appAddress,
      tag: ['tee', 'scone'],
      volume: 5,
      appprice: 0,
    })
    .then(resourceProvider.order.signApporder)
    .then(resourceProvider.order.publishApporder);

  // create & publish workerpool order
  await resourceProvider.order
    .createWorkerpoolorder({
      workerpool: workerpoolAddress,
      category: 0,
      tag: ['tee', 'scone'],
      volume: 5,
      workerpoolprice: 0,
    })
    .then(resourceProvider.order.signWorkerpoolorder)
    .then(resourceProvider.order.publishWorkerpoolorder);
};
