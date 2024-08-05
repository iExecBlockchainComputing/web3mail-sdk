import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers';
import {
  Web3MailConfigOptions,
  Web3SignerProvider,
} from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import 'dotenv/config';

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const waitSubgraphIndexing = () => sleep(5_000);

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

const TEST_RPC_URL = process.env.DRONE
  ? 'http://bellecour-fork:8545'
  : 'http://127.0.0.1:8545';

export const getTestWeb3SignerProvider = (
  privateKey: string
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(TEST_RPC_URL, privateKey);

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

export const createAndPublishTestOrders = async (
  resourceProvider,
  appAddress,
  workerpoolAddress
) => {
  await resourceProvider.order
    .createApporder({
      app: appAddress,
      tag: ['tee', 'scone'],
      volume: 100,
      appprice: 0,
    })
    .then(resourceProvider.order.signApporder)
    .then(resourceProvider.order.publishApporder);

  await resourceProvider.order
    .createWorkerpoolorder({
      workerpool: workerpoolAddress,
      category: 0,
      tag: ['tee', 'scone'],
      volume: 100,
      workerpoolprice: 0,
    })
    .then(resourceProvider.order.signWorkerpoolorder)
    .then(resourceProvider.order.publishWorkerpoolorder);
};

const impersonateAccount = async (rpcURL, address) => {
  const response = await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_impersonateAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to impersonate account ${address}`);
  }

  console.log(`Impersonating ${address}`);
};

const stopImpersonatingAccount = async (rpcURL, address) => {
  const response = await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_stopImpersonatingAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stop impersonating account ${address}`);
  }

  console.log(`Stop impersonating ${address}`);
};

export const getIExecResourceOwnership = async (
  resourceAddress,
  targetOwner
) => {
  const provider = new JsonRpcProvider(TEST_RPC_URL);

  const RESOURCE_ABI = [
    {
      inputs: [],
      name: 'owner',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
      constant: true,
    },
    {
      inputs: [],
      name: 'registry',
      outputs: [
        {
          internalType: 'contract IRegistry',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const RESOURCE_REGISTRY_ABI = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  const resourceContract = new Contract(
    resourceAddress,
    RESOURCE_ABI,
    provider
  ) as any;

  const resourceOwner = await resourceContract.owner();
  const resourceRegistryAddress = await resourceContract.registry();

  const resourceRegistryContract = new Contract(
    resourceRegistryAddress,
    RESOURCE_REGISTRY_ABI,
    provider
  ) as any;

  await impersonateAccount(TEST_RPC_URL, resourceOwner);
  const tx = await resourceRegistryContract
    .connect(new JsonRpcSigner(provider, resourceOwner))
    .safeTransferFrom(resourceOwner, targetOwner, resourceAddress, {
      gasPrice: 0,
    });
  await tx.wait();
  await stopImpersonatingAccount(TEST_RPC_URL, resourceOwner);

  const newOwner = await resourceContract.owner();
  console.log(`Contract at ${resourceAddress} is now owned by ${newOwner}`);
};
