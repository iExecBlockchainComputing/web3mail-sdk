import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  Wallet,
  formatEther,
  toBeHex,
} from 'ethers';

const TARGET_POCO_ADMIN_WALLET = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';

// Must match TEST_CHAIN.appOwnerWallet in test-utils.ts
const APP_OWNER_WALLET_ADDRESS = new Wallet(
  '0xa911b93e50f57c156da0b8bff2277d241bcdb9345221a3e246a99c6e7cedcde5'
).address; // 0x626D65C778fB98f813C25F84249E3012B80e8d91

// Web3mail dapp (compass mock) — fixed address; no ENS on 421614 fork
const DAPP_ADDRESS = '0x09d59e1B696D0cb69f46bf762412636E8652aB58';

// Must match TEST_CHAIN.prodWorkerpool
const PROD_WORKERPOOL_ADDRESS = '0x2956f0cb779904795a5f30d3b3ea88b714c3123f';
// Must match TEST_CHAIN.paidOnlyWorkerpool — never gets free orders published
const PAID_ONLY_WORKERPOOL_ADDRESS = '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F';
// Default Arbitrum Sepolia pool (e2e "learn" / free) — same TEST_CHAIN.learnProdWorkerpool
// const LEARN_WORKERPOOL_ADDRESS =
//   '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F';
// Must match TEST_CHAIN.prodWorkerpoolOwnerWallet
const PROD_WORKERPOOL_OWNER_TEST = new Wallet(
  '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
).address;

const getProvider = (rpcUrl) =>
  new JsonRpcProvider(rpcUrl, undefined, {
    pollingInterval: 100, // fast polling for tests
  });

const setBalance = (rpcUrl) => async (address, weiAmount) => {
  console.log(`setting balance of ${address} to ${formatEther(weiAmount)}`);
  console.log('rpcUrl', rpcUrl);
  await fetch(rpcUrl, {
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
  const balance = await getProvider(rpcUrl).getBalance(address);
  console.log(`${address} wallet balance is now ${formatEther(balance)}`);
};

const impersonate = (rpcUrl) => async (address) => {
  await fetch(rpcUrl, {
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

const stopImpersonate = (rpcUrl) => async (address) => {
  await fetch(rpcUrl, {
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

const getIExecHubOwnership =
  (rpcUrl, legacyTx = false) =>
  async (hubAddress, targetOwner) => {
    const iexecContract = new Contract(
      hubAddress,
      [
        {
          inputs: [],
          name: 'owner',
          outputs: [{ internalType: 'address', name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
          constant: true,
        },
        {
          inputs: [
            { internalType: 'address', name: 'newOwner', type: 'address' },
          ],
          name: 'transferOwnership',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      getProvider(rpcUrl)
    );
    const iexecOwner = await iexecContract.owner();
    await setBalance(rpcUrl)(iexecOwner, 1n * 10n ** 18n); // give some ETH to the owner to be able to send the transaction
    await impersonate(rpcUrl)(iexecOwner);
    await iexecContract
      .connect(new JsonRpcSigner(getProvider(rpcUrl), iexecOwner))
      .transferOwnership(targetOwner, legacyTx ? { gasPrice: 0 } : {})
      .then((tx) => tx.wait());
    await stopImpersonate(rpcUrl)(iexecOwner);

    const newOwner = await iexecContract.owner();
    console.log(`IExecHub proxy at ${hubAddress} is now owned by ${newOwner}`);
  };

/**
 * prepare-bellecour-fork-for-tests.js: IExec v8 resource = ERC-721 in `registry()`.
 * Transfer the token to the test wallet (same as Bellecour learn/prod + web3mail app).
 * Arbitrum Sepolia: fixed `resourceAddress`, gasLimit for the fork.
 */
const getIExecResourceOwnership =
  (rpcUrl) => async (resourceAddress, targetOwner) => {
    const RESOURCE_ABI = [
      {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'registry',
        outputs: [
          { internalType: 'contract IRegistry', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ];
    const RESOURCE_REGISTRY_ABI = [
      {
        inputs: [
          { internalType: 'address', name: 'from', type: 'address' },
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        ],
        name: 'safeTransferFrom',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    const provider = getProvider(rpcUrl);
    const resourceContract = new Contract(
      resourceAddress,
      RESOURCE_ABI,
      provider
    );
    const resourceOwner = await resourceContract.owner();
    if (resourceOwner.toLowerCase() === targetOwner.toLowerCase()) {
      console.log(
        `resource ${resourceAddress} is already owned by ${targetOwner}`
      );
      return;
    }
    const resourceRegistryAddress = await resourceContract.registry();
    const resourceRegistryContract = new Contract(
      resourceRegistryAddress,
      RESOURCE_REGISTRY_ABI,
      provider
    );
    const tokenId = BigInt(resourceAddress);
    await setBalance(rpcUrl)(resourceOwner, 1n * 10n ** 18n);
    await impersonate(rpcUrl)(resourceOwner);
    const txOpts = { gasLimit: 4_000_000n };
    await resourceRegistryContract
      .connect(new JsonRpcSigner(provider, resourceOwner))
      .safeTransferFrom(resourceOwner, targetOwner, tokenId, txOpts)
      .then((tx) => tx.wait());
    await stopImpersonate(rpcUrl)(resourceOwner);

    const newOwner = await resourceContract.owner();
    console.log(`resource ${resourceAddress} is now owned by ${newOwner}`);
  };

const main = async () => {
  const arbitrumSepoliaForkRpcUrl = 'http://localhost:8555';
  console.log(
    `preparing arbitrum-sepolia-fork at ${arbitrumSepoliaForkRpcUrl}`
  );
  await setBalance(arbitrumSepoliaForkRpcUrl)(
    TARGET_POCO_ADMIN_WALLET,
    1000000n * 10n ** 18n
  );
  await getIExecHubOwnership(arbitrumSepoliaForkRpcUrl)(
    '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    TARGET_POCO_ADMIN_WALLET
  );
  await setBalance(arbitrumSepoliaForkRpcUrl)(
    APP_OWNER_WALLET_ADDRESS,
    1n * 10n ** 18n
  );
  await getIExecResourceOwnership(arbitrumSepoliaForkRpcUrl)(
    DAPP_ADDRESS,
    APP_OWNER_WALLET_ADDRESS
  );
  await getIExecResourceOwnership(arbitrumSepoliaForkRpcUrl)(
    PROD_WORKERPOOL_ADDRESS,
    PROD_WORKERPOOL_OWNER_TEST
  );
  await getIExecResourceOwnership(arbitrumSepoliaForkRpcUrl)(
    PAID_ONLY_WORKERPOOL_ADDRESS,
    PROD_WORKERPOOL_OWNER_TEST
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
