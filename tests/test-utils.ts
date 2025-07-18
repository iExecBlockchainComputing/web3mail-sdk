// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Wallet, JsonRpcProvider, ethers, Contract } from 'ethers';
import {
  Web3MailConfigOptions,
  Web3SignerProvider,
} from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import { getSignerFromPrivateKey } from 'iexec/utils';

export const TEST_CHAIN = {
  rpcURL: 'http://127.0.0.1:8545',
  chainId: '134',
  smsURL: 'http://127.0.0.1:13300',
  resultProxyURL: 'http://127.0.0.1:13200',
  iexecGatewayURL: 'http://127.0.0.1:3000',
  voucherHubAddress: '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda',
  voucherManagerWallet: new Wallet(
    '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33'
  ),
  voucherSubgraphURL: 'http://127.0.0.1:8000/subgraphs/name/bellecour/iexec-voucher',
  learnProdWorkerpool: 'prod-v8-learn.main.pools.iexec.eth',
  learnProdWorkerpoolOwnerWallet: new Wallet(
    '0x800e01919eadf36f110f733decb1cc0f82e7941a748e89d7a3f76157f6654bb3'
  ),
  prodWorkerpool: 'prod-v8-bellecour.main.pools.iexec.eth',
  prodWorkerpoolOwnerWallet: new Wallet(
    '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
  ),
  appOwnerWallet: new Wallet(
    '0xa911b93e50f57c156da0b8bff2277d241bcdb9345221a3e246a99c6e7cedcde5'
  ),
  provider: new JsonRpcProvider(
    'http://127.0.0.1:8545',
    undefined,
    {
      pollingInterval: 1000, // speed up tests
    }
  ),
  hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const MAX_EXPECTED_SUBGRAPH_INDEXING_TIME = 5_000;

export const waitSubgraphIndexing = () =>
  sleep(MAX_EXPECTED_SUBGRAPH_INDEXING_TIME);

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomWallet = () => Wallet.createRandom();

export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

export const MARKET_API_CALL_TIMEOUT = 2_000;

export const timeouts = {
  // utils
  createVoucherType: MAX_EXPECTED_BLOCKTIME * 2,
  createVoucher: MAX_EXPECTED_BLOCKTIME * 4 + MARKET_API_CALL_TIMEOUT * 2,
};

export const getTestWeb3SignerProvider = (
  privateKey: string = Wallet.createRandom().privateKey
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(TEST_CHAIN.rpcURL, privateKey);

export const getTestIExecOption = () => ({
  smsURL: TEST_CHAIN.smsURL,
  resultProxyURL: TEST_CHAIN.resultProxyURL,
  iexecGatewayURL: TEST_CHAIN.iexecGatewayURL,
  voucherHubAddress: TEST_CHAIN.voucherHubAddress,
  voucherSubgraphURL: TEST_CHAIN.voucherSubgraphURL,
});

export const getTestConfig = (
  privateKey: string
): [Web3SignerProvider, Web3MailConfigOptions] => {
  const ethProvider = getTestWeb3SignerProvider(privateKey);
  const options = {
    iexecOptions: getTestIExecOption(),
    ipfsGateway: 'http://127.0.0.1:8080',
    ipfsNode: 'http://127.0.0.1:5001',
    dataProtectorSubgraph:
      'http://127.0.0.1:8000/subgraphs/name/DataProtector-v2',
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

export const getRandomTxHash = () => {
  const characters = '0123456789abcdef';
  let hash = '0x';

  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hash += characters[randomIndex];
  }

  return hash;
};

export const createAndPublishAppOrders = async (
  resourceProvider,
  appAddress
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

export const ensureSufficientStake = async (
  iexec: IExec,
  requiredStake: ethers.BigNumberish
) => {
  const walletAddress = await iexec.wallet.getAddress();
  const account = await iexec.account.checkBalance(walletAddress);

  if (BigInt(account.stake.toString()) < BigInt(requiredStake.toString())) {
    await setNRlcBalance(walletAddress, requiredStake);
    await iexec.account.deposit(requiredStake);
  }
};

export const createAndPublishWorkerpoolOrder = async (
  workerpool: string,
  workerpoolOwnerWallet: ethers.Wallet,
  requesterrestrict?: string,
  workerpoolprice: number = 0,
  volume: number = 1000
) => {
  const ethProvider = utils.getSignerFromPrivateKey(
    TEST_CHAIN.rpcURL,
    workerpoolOwnerWallet.privateKey
  );
  const iexec = new IExec({ ethProvider }, getTestIExecOption());
  const requiredStake = volume * workerpoolprice;
  await ensureSufficientStake(iexec, requiredStake);

  const workerpoolorder = await iexec.order.createWorkerpoolorder({
    workerpool,
    category: 0,
    requesterrestrict,
    volume,
    workerpoolprice,
    tag: ['tee', 'scone'],
  });
  await iexec.order
    .signWorkerpoolorder(workerpoolorder)
    .then((o) => iexec.order.publishWorkerpoolorder(o));
};

export const WORKERPOOL_ORDER_PER_VOUCHER = 1000;

export const createVoucher = async ({
  owner,
  voucherType,
  value,
  skipOrders = false,
}: {
  owner: string;
  voucherType: ethers.BigNumberish;
  value: ethers.BigNumberish;
  skipOrders?: boolean;
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

  if (!skipOrders) {
    try {
      const workerpoolprice = Math.floor(value / WORKERPOOL_ORDER_PER_VOUCHER);
      await createAndPublishWorkerpoolOrder(
        TEST_CHAIN.prodWorkerpool,
        TEST_CHAIN.prodWorkerpoolOwnerWallet,
        owner,
        workerpoolprice,
        WORKERPOOL_ORDER_PER_VOUCHER
      );
    } catch (error) {
      console.error('Error publishing workerpoolorder:', error);
      throw error;
    }
  }

  try {
    return await voucherHubContract.getVoucher(owner);
  } catch (error) {
    console.error('Error getting voucher:', error);
    throw error;
  }
};

export const addVoucherEligibleAsset = async (assetAddress, voucherTypeId) => {
  const voucherHubContract = new Contract(TEST_CHAIN.voucherHubAddress, [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'voucherTypeId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'asset',
          type: 'address',
        },
      ],
      name: 'addEligibleAsset',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]);

  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);

  const retryableAddEligibleAsset = async (tryCount = 1) => {
    try {
      const tx = await voucherHubContract
        .connect(signer)
        .addEligibleAsset(voucherTypeId, assetAddress);
      await tx.wait();
    } catch (error) {
      console.warn(
        `Error adding eligible asset to voucher (try count ${tryCount}):`,
        error
      );
      if (tryCount < 3) {
        await sleep(3000 * tryCount);
        await retryableAddEligibleAsset(tryCount + 1);
      } else {
        throw new Error(
          `Failed to add eligible asset to voucher after ${tryCount} attempts`
        );
      }
    }
  };
  await retryableAddEligibleAsset();
};
