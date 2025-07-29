import {
  Contract,
  EnsPlugin,
  JsonRpcProvider,
  JsonRpcSigner,
  Network,
  formatEther,
  keccak256,
  toBeHex,
} from 'ethers';

const VOUCHER_HUB_ADDRESS = '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda';
const TARGET_VOUCHER_MANAGER_WALLET =
  '0x44cA21A3c4efE9B1A0268e2e9B2547E7d9C8f19C'; // Should be same wallet as TEST_CHAIN.voucherManagerWallet
const LEARN_WORKERPOOL_OWNER_WALLET =
  '0x02D0e61355e963210d0DE382e6BA09781181bB94';
const PROD_WORKERPOOL_OWNER_WALLET =
  '0x1Ff6AfF580e8Ca738F76485E0914C2aCaDa7B462';
const APP_OWNER_WALLET = '0x626D65C778fB98f813C25F84249E3012B80e8d91';
const LEARN_WORKERPOOL_ENS = 'prod-v8-learn.main.pools.iexec.eth';
const PROD_WORKERPOOL_ENS = 'prod-v8-bellecour.main.pools.iexec.eth';
const WEB3_MAIL_DAPP_ADDRESS_ENS = 'web3mail.apps.iexec.eth';

const rpcURL = 'http://127.0.0.1:8545';

const provider = new JsonRpcProvider(
  rpcURL,
  new Network('bellecour-fork', 134).attachPlugin(
    new EnsPlugin('0x5f5B93fca68c9C79318d1F3868A354EE67D8c006', 134)
  ),
  {
    pollingInterval: 1000, // speed up tests
  }
);

const LEARN_WORKERPOOL = await provider.resolveName(LEARN_WORKERPOOL_ENS);
const PROD_WORKERPOOL = await provider.resolveName(PROD_WORKERPOOL_ENS);
const WEB3_MAIL_DAPP_ADDRESS = await provider.resolveName(
  WEB3_MAIL_DAPP_ADDRESS_ENS
);

const setBalance = async (address, weiAmount) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, toBeHex(weiAmount)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const balance = await provider.getBalance(address);
  console.log(`${address} wallet balance is now ${formatEther(balance)} RLC`);
};

const impersonate = async (address) => {
  await fetch(rpcURL, {
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
  console.log(`impersonating ${address}`);
};

const stopImpersonate = async (address) => {
  await fetch(rpcURL, {
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
  console.log(`stop impersonating ${address}`);
};

const getVoucherManagementRoles = async (targetManager) => {
  const voucherHubContract = new Contract(
    VOUCHER_HUB_ADDRESS,
    [
      {
        inputs: [],
        name: 'defaultAdmin',
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
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'role',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'grantRole',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'role',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'hasRole',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    provider
  );

  const defaultAdmin = await voucherHubContract.defaultAdmin();

  console.log('VoucherHub defaultAdmin:', defaultAdmin);

  await impersonate(defaultAdmin);

  const MINTER_ROLE = keccak256(Buffer.from('MINTER_ROLE'));

  const MANAGER_ROLE = keccak256(Buffer.from('MANAGER_ROLE'));

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(MINTER_ROLE, targetManager, { gasPrice: 0 })
    .then((tx) => tx.wait());

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(MANAGER_ROLE, targetManager, {
      gasPrice: 0,
    })
    .then((tx) => tx.wait());

  await stopImpersonate(defaultAdmin);

  console.log(
    `${targetManager} has role MINTER_ROLE: ${await voucherHubContract.hasRole(
      MINTER_ROLE,
      targetManager
    )}`
  );

  console.log(
    `${targetManager} has role MANAGER_ROLE: ${await voucherHubContract.hasRole(
      MANAGER_ROLE,
      targetManager
    )}`
  );
};

const getIExecResourceOwnership = async (resourceAddress, targetOwner) => {
  const RESOURCE_ABI = [
    {
      inputs: [],
      name: 'owner',
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
  );

  const resourceOwner = await resourceContract.owner();
  const resourceRegistryAddress = await resourceContract.registry();
  const resourceRegistryContract = new Contract(
    resourceRegistryAddress,
    RESOURCE_REGISTRY_ABI,
    provider
  );

  await impersonate(resourceOwner);
  await resourceRegistryContract
    .connect(new JsonRpcSigner(provider, resourceOwner))
    .safeTransferFrom(resourceOwner, targetOwner, resourceAddress, {
      gasPrice: 0,
    })
    .then((tx) => tx.wait());
  await stopImpersonate(resourceOwner);

  const newOwner = await resourceContract.owner();
  console.log(`resource ${resourceAddress} is now owned by ${newOwner}`);
};

const main = async () => {
  console.log(`preparing bellecour-fork at ${rpcURL}`);

  // prepare Voucher
  await setBalance(TARGET_VOUCHER_MANAGER_WALLET, 1000000n * 10n ** 18n);
  await getVoucherManagementRoles(TARGET_VOUCHER_MANAGER_WALLET);

  // prepare workerpools
  await getIExecResourceOwnership(
    LEARN_WORKERPOOL,
    LEARN_WORKERPOOL_OWNER_WALLET
  );
  await getIExecResourceOwnership(
    PROD_WORKERPOOL,
    PROD_WORKERPOOL_OWNER_WALLET
  );

  // prepare web3mail app for tests
  await getIExecResourceOwnership(WEB3_MAIL_DAPP_ADDRESS, APP_OWNER_WALLET);
};

main();
