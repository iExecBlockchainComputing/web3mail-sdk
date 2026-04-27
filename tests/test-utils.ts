// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  Wallet,
  JsonRpcProvider,
  ethers,
  Contract,
  AbiCoder,
  keccak256,
  toBeHex,
} from 'ethers';
import {
  Web3MailConfigOptions,
  Web3SignerProvider,
} from '../src/web3mail/types.js';
import { IExec, utils } from 'iexec';
import { randomInt } from 'crypto';
import { getSignerFromPrivateKey } from 'iexec/utils';

export const TEST_COMPASS_URL = 'http://127.0.0.1:8069';

const TEST_POOL_SIGNER = new Wallet(
  '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
);

export const TEST_CHAIN = {
  name: 'arbitrum-sepolia' as const,
  isNative: false,
  useGas: true,
  ipfsGateway: 'http://127.0.0.1:8080',
  ipfsNode: 'http://127.0.0.1:5001',
  ipfsGatewayURL: 'http://127.0.0.1:8080',
  ipfsNodeURL: 'http://127.0.0.1:5001',
  rpcURL: 'http://127.0.0.1:8555',
  chainId: '421614',
  smsURL: 'http://127.0.0.1:13350',
  resultProxyURL: 'http://127.0.0.1:13250',
  iexecGatewayURL: 'http://127.0.0.1:3050',
  compassUrl: TEST_COMPASS_URL,
  voucherHubAddress: '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda',
  voucherManagerWallet: new Wallet(
    '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33'
  ),
  voucherSubgraphURL:
    'http://127.0.0.1:8000/subgraphs/name/bellecour/iexec-voucher',
  prodWorkerpool: '0x2956f0cb779904795a5f30d3b3ea88b714c3123f',
  prodWorkerpoolOwnerWallet: TEST_POOL_SIGNER,
  // Used exclusively for tests that require NO free orders to be present.
  // Never publish price=0 orders against this address.
  paidOnlyWorkerpool: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
  paidOnlyWorkerpoolOwnerWallet: TEST_POOL_SIGNER,
  appOwnerWallet: new Wallet(
    '0xa911b93e50f57c156da0b8bff2277d241bcdb9345221a3e246a99c6e7cedcde5'
  ),
  provider: new JsonRpcProvider('http://127.0.0.1:8555', undefined, {
    pollingInterval: 100,
  }),
  hubAddress: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
  defaultInitBalance: 1n * 10n ** 18n,
};

const HUB_TOKEN_ABI = [
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC20_BALANCE_SLOT =
  '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00';

const anvilSetStorageAt = async (
  contract: string,
  slot: string,
  value: string
) => {
  await fetch(TEST_CHAIN.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setStorageAt',
      params: [contract, slot, value],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: { 'Content-Type': 'application/json' },
  });
};

const anvilSetNRlcTokenBalance = async (
  address: string,
  targetNRlcBalance: bigint
) => {
  const hubAddress = TEST_CHAIN.hubAddress;
  const rlcAddress = await new Contract(
    hubAddress,
    HUB_TOKEN_ABI,
    TEST_CHAIN.provider
  ).token();
  const balanceSlot = keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [address, ERC20_BALANCE_SLOT]
    )
  );
  await anvilSetStorageAt(
    rlcAddress,
    balanceSlot,
    toBeHex(targetNRlcBalance, 32)
  );
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const MAX_EXPECTED_SUBGRAPH_INDEXING_TIME = 10_000;

const DATAPROTECTOR_SUBGRAPH_URL =
  'http://127.0.0.1:8000/subgraphs/name/DataProtector-v2';

export const waitSubgraphIndexing = async (
  timeoutMs = 60_000
): Promise<void> => {
  const provider = new JsonRpcProvider(TEST_CHAIN.rpcURL);
  const targetBlock = await provider.getBlockNumber();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(DATAPROTECTOR_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _meta { block { number } } }' }),
      });
      const json = await res.json();
      const indexedBlock: number = json?.data?._meta?.block?.number ?? 0;
      if (indexedBlock >= targetBlock) return;
    } catch {
      // subgraph not ready yet, keep polling
    }
    await sleep(1_000);
  }
  throw new Error(
    `waitSubgraphIndexing: subgraph did not index block ${targetBlock} within ${timeoutMs}ms`
  );
};

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
  ipfsGateway: TEST_CHAIN.ipfsGateway,
  ipfsNode: TEST_CHAIN.ipfsNode,
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
    compassUrl: TEST_COMPASS_URL,
  };
  return [ethProvider, options];
};

export const getTestDappAddress = async (): Promise<string> => {
  const chainId = Number(TEST_CHAIN.chainId);
  const res = await fetch(
    `${TEST_COMPASS_URL}/${chainId}/iapps/web3mail-tdx`
  ).then((r) => r.json());
  if (!res?.address) {
    throw new Error(`Could not resolve dapp address from test compass`);
  }
  return res.address as string;
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
      tag: ['tee', 'tdx'],
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
  const n = BigInt(`${nRlcTargetBalance}`);
  if (TEST_CHAIN.isNative) {
    const weiAmount = n * 10n ** 9n;
    await setBalance(address, weiAmount);
  } else {
    await anvilSetNRlcTokenBalance(address, n);
  }
};

export const setEthForGas = async (
  address: string,
  wei: bigint = TEST_CHAIN.defaultInitBalance
) => {
  if (!TEST_CHAIN.isNative) {
    await setBalance(address, wei);
  }
};

export const createVoucherType = async ({
  description = 'test',
  duration = 1000,
} = {}) => {
  await setEthForGas(TEST_CHAIN.voucherManagerWallet.address);
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
  if (!TEST_CHAIN.isNative) {
    await setEthForGas(walletAddress);
  }

  if (BigInt(account.stake.toString()) < BigInt(requiredStake.toString())) {
    await setNRlcBalance(walletAddress, requiredStake);
    try {
      await iexec.account.deposit(requiredStake);
    } catch (error: any) {
      // Handle "transaction already imported" error - this can happen when
      // multiple tests run in parallel and try to deposit simultaneously.
      // If the transaction is already submitted, we can check if the balance
      // will be sufficient after it's mined, or just wait a bit and retry.
      if (
        error?.message?.includes('transaction already imported') ||
        error?.code === -32003 ||
        (error?.cause?.code === -32003 &&
          error?.cause?.message?.includes('transaction already imported'))
      ) {
        // Wait a bit for the transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Re-check balance - if it's now sufficient, we're good
        const updatedAccount = await iexec.account.checkBalance(walletAddress);
        if (
          BigInt(updatedAccount.stake.toString()) >=
          BigInt(requiredStake.toString())
        ) {
          // Balance is sufficient, transaction was already processed
          return;
        }
        // If still insufficient, the transaction might be pending or failed
        // Try one more time after waiting
        try {
          await iexec.account.deposit(requiredStake);
        } catch (retryError: any) {
          // If it still fails with the same error, check balance one more time
          if (
            retryError?.message?.includes('transaction already imported') ||
            retryError?.code === -32003
          ) {
            const finalAccount = await iexec.account.checkBalance(
              walletAddress
            );
            if (
              BigInt(finalAccount.stake.toString()) >=
              BigInt(requiredStake.toString())
            ) {
              return;
            }
          }
          // If balance is still insufficient, throw the original error
          throw retryError;
        }
      } else {
        // For other errors, re-throw
        throw error;
      }
    }
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
  await setEthForGas(workerpoolOwnerWallet.address);
  await ensureSufficientStake(iexec, requiredStake);

  const workerpoolorder = await iexec.order.createWorkerpoolorder({
    workerpool,
    category: 0,
    requesterrestrict,
    volume,
    workerpoolprice,
    tag: ['tee', 'tdx'],
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

  const voucherManagerAddress = await iexec.wallet.getAddress();
  await setEthForGas(voucherManagerAddress);

  await setNRlcBalance(voucherManagerAddress, value);

  const contractClient = await iexec.config.resolveContractsClient();
  const iexecContract = contractClient.getIExecContract();
  const nRlc = BigInt(value);

  try {
    if (TEST_CHAIN.isNative) {
      await iexecContract.depositFor(TEST_CHAIN.voucherHubAddress, {
        value: nRlc * 10n ** 9n,
        gasPrice: 0,
      });
    } else {
      const tx = await iexecContract.depositFor(
        nRlc,
        TEST_CHAIN.voucherHubAddress
      );
      await tx.wait();
    }
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
  await setEthForGas(signer.address);

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
