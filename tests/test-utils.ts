// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Wallet, JsonRpcProvider, ethers, JsonRpcSigner, Contract } from 'ethers';
import {
  Web3MailConfigOptions,
  Web3SignerProvider,
} from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import { getSignerFromPrivateKey } from 'iexec/utils';
// eslint-disable-next-line import/extensions
import { VOUCHER_HUB_ADDRESS } from './bellecour-fork/voucher-config.js';

const { DRONE } = process.env;

const TEST_CHAIN = {
  rpcURL: process.env.DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
  chainId: '134',
  smsURL: process.env.DRONE ? 'http://sms:13300' : 'http://127.0.0.1:13300',
  resultProxyURL: process.env.DRONE
    ? 'http://result-proxy:13200'
    : 'http://127.0.0.1:13200',
  iexecGatewayURL: process.env.DRONE ? 'http://market-api:3000' : 'http://127.0.0.1:3000',
  voucherHubAddress: VOUCHER_HUB_ADDRESS, // TODO: change with deployment address once voucher is deployed on bellecour
  voucherManagerWallet: new Wallet(
    '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33'
  ),
  voucherSubgraphURL: process.env.DRONE
    ? 'http://gaphnode:8000/subgraphs/name/bellecour/iexec-voucher'
    : 'http://localhost:8000/subgraphs/name/bellecour/iexec-voucher',
  debugWorkerpool: 'debug-v8-bellecour.main.pools.iexec.eth',
  debugWorkerpoolOwnerWallet: new Wallet(
    '0x800e01919eadf36f110f733decb1cc0f82e7941a748e89d7a3f76157f6654bb3'
  ),
  prodWorkerpool: 'prod-v8-bellecour.main.pools.iexec.eth',
  prodWorkerpoolOwnerWallet: new Wallet(
    '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
  ),
  provider: new JsonRpcProvider(
    process.env.DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545'
  ),
  hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

export const MARKET_API_CALL_TIMEOUT = 2_000;

export const timeouts= {
  // utils
  createVoucherType: MAX_EXPECTED_BLOCKTIME * 2,
  createVoucher: MAX_EXPECTED_BLOCKTIME * 4 + MARKET_API_CALL_TIMEOUT * 2,
};

const TEST_RPC_URL = process.env.DRONE
  ? 'http://bellecour-fork:8545'
  : 'http://127.0.0.1:8545';

  export const getTestWeb3SignerProvider = (
    privateKey: string = Wallet.createRandom().privateKey
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
        voucherHubAddress: TEST_CHAIN.voucherHubAddress,
        voucherSubgraphURL: TEST_CHAIN.voucherSubgraphURL,
    });

export const getTestConfig = (
  privateKey: string
): [Web3SignerProvider, Web3MailConfigOptions] => {
  const ethProvider = getTestWeb3SignerProvider(privateKey);
  const options = {
    iexecOptions: getTestIExecOption(),
    ipfsGateway: DRONE
      ? 'http://ipfs:8080'
      : 'http://127.0.0.1:8080',
    ipfsNode: DRONE ? 'http://ipfs:5001' : 'http://127.0.0.1:5001',
    dataProtectorSubgraph: DRONE
      ? 'http://graphnode:8000/subgraphs/name/DataProtector'
      : 'http://127.0.0.1:8000/subgraphs/name/DataProtector',
  };
  return [ethProvider, options];
};

export const getEventFromLogs = (eventName, logs, { strict = true }) => {
  const eventFound = logs.find((log) => log.eventName === eventName);
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return undefined;
  }
  return eventFound;
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

export const setBalance = async (
  address: string,
  targetWeiBalance: ethers.BigNumberish
) => {
  await fetch(TEST_CHAIN.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, ethers.toBeHex(targetWeiBalance)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const setNRlcBalance = async (
  address: string,
  nRlcTargetBalance: ethers.BigNumberish
) => {
  const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
  await setBalance(address, weiAmount);
};

export const createVoucherType = async ({
  description = 'test',
  duration = 1000,
} = {}) => {
  const VOUCHER_HUB_ABI = [
    {
      inputs: [
        {
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
        {
          internalType: 'uint256',
          name: 'duration',
          type: 'uint256',
        },
      ],
      name: 'createVoucherType',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'duration',
          type: 'uint256',
        },
      ],
      name: 'VoucherTypeCreated',
      type: 'event',
    },
  ];
  const voucherHubContract = new Contract(
    TEST_CHAIN.voucherHubAddress,
    VOUCHER_HUB_ABI,
    TEST_CHAIN.provider
  );
  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);
  const createVoucherTypeTxHash = await voucherHubContract
    .connect(signer)
    .createVoucherType(description, duration);
  const txReceipt = await createVoucherTypeTxHash.wait();
  const { id } = getEventFromLogs('VoucherTypeCreated', txReceipt.logs, {
    strict: true,
  }).args;

  return id as bigint;
};

// TODO: update createWorkerpoolorder() parameters when it is specified
const createAndPublishWorkerpoolOrder = async (
  workerpool: string,
  workerpoolOwnerWallet: ethers.Wallet,
  voucherOwnerAddress: string
) => {
  const ethProvider = utils.getSignerFromPrivateKey(
    TEST_RPC_URL,
    workerpoolOwnerWallet.privateKey
  );
  const iexec = new IExec({ ethProvider }, getTestIExecOption());

  const workerpoolprice = 1000;
  const volume = 1000;

  await setNRlcBalance(
    await iexec.wallet.getAddress(),
    volume * workerpoolprice
  );
  await iexec.account.deposit(volume * workerpoolprice);

  const workerpoolorder = await iexec.order.createWorkerpoolorder({
    workerpool,
    category: 0,
    requesterrestrict: voucherOwnerAddress,
    volume,
    workerpoolprice,
    tag: ['tee', 'scone'],
  });

  await iexec.order
    .signWorkerpoolorder(workerpoolorder)
    .then((o) => iexec.order.publishWorkerpoolorder(o));
};

export const createVoucher = async ({
  owner,
  voucherType,
  value,
}: {
  owner: string;
  voucherType: ethers.BigNumberish;
  value: ethers.BigNumberish;
}) => {
  const VOUCHER_HUB_ABI = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'voucherType',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'createVoucher',
      outputs: [
        {
          internalType: 'address',
          name: 'voucherAddress',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'getVoucher',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  const iexec = new IExec(
    {
      ethProvider: getSignerFromPrivateKey(
        TEST_CHAIN.rpcURL,
        TEST_CHAIN.voucherManagerWallet.privateKey
      ),
    },
    { hubAddress: TEST_CHAIN.hubAddress }
  );

  // ensure RLC balance
  await setNRlcBalance(await iexec.wallet.getAddress(), value);

  // deposit RLC to voucherHub
  const contractClient = await iexec.config.resolveContractsClient();
  const iexecContract = contractClient.getIExecContract();

  try {
    await iexecContract.depositFor(TEST_CHAIN.voucherHubAddress, {
      value: BigInt(value) * 10n ** 9n,
      gasPrice: 0,
    });
  } catch (error) {
    console.error('Error depositing RLC:', error);
    throw error;
  }

  const voucherHubContract = new Contract(
    TEST_CHAIN.voucherHubAddress,
    VOUCHER_HUB_ABI,
    TEST_CHAIN.provider
  );

  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);

  try {
    const createVoucherTxHash = await voucherHubContract
      .connect(signer)
      .createVoucher(owner, voucherType, value);

    await createVoucherTxHash.wait();
  } catch (error) {
    console.error('Error creating voucher:', error);
    throw error;
  }

  try {
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.debugWorkerpool,
      TEST_CHAIN.debugWorkerpoolOwnerWallet,
      owner
    );
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      owner
    );
  } catch (error) {
    console.error('Error publishing workerpoolorder:', error);
    throw error;
  }

  try {
    return await voucherHubContract.getVoucher(owner);
  } catch (error) {
    console.error('Error getting voucher:', error);
    throw error;
  }
};
