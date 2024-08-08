import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers';
import { Web3SignerProvider } from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import 'dotenv/config';
import { iexecOptions } from '../src/config/config.js';

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const waitSubgraphIndexing = () => sleep(5_000);

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

export const getTestWeb3SignerProvider = (
  privateKey: string
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(iexecOptions.rpcURL, privateKey);

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
  const provider = new JsonRpcProvider(iexecOptions.rpcURL);

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

  await impersonateAccount(iexecOptions.rpcURL, resourceOwner);
  const tx = await resourceRegistryContract
    .connect(new JsonRpcSigner(provider, resourceOwner))
    .safeTransferFrom(resourceOwner, targetOwner, resourceAddress, {
      gasPrice: 0,
    });
  await tx.wait();
  await stopImpersonatingAccount(iexecOptions.rpcURL, resourceOwner);

  const newOwner = await resourceContract.owner();
  console.log(`Contract at ${resourceAddress} is now owned by ${newOwner}`);
};
