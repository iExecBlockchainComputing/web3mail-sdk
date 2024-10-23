import { Address, BN } from 'iexec';
import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';
// import { VoucherInfo } from 'iexec/IExecVoucherModule';

// To import from 'iexec' once exported
type VoucherInfo = {
  owner: Address;
  address: Address;
  type: BN;
  balance: BN;
  expirationTimestamp: BN;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: BN;
  authorizedAccounts: Address[];
};

function bnToNumber(bn: BN) {
  return Number(bn.toString());
}

export function checkUserVoucher({
  userVoucher,
}: {
  userVoucher: VoucherInfo;
}) {
  if (bnToNumber(userVoucher.expirationTimestamp) < Date.now() / 1000) {
    throw new Error(
      'Oops, it seems your voucher has expired. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
    );
  }

  if (bnToNumber(userVoucher.balance) === 0) {
    throw new Error(
      'Oops, it seems your voucher is empty. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
    );
  }
}

export function filterWorkerpoolOrders({
  workerpoolOrders,
  workerpoolMaxPrice,
  useVoucher,
  userVoucher,
}: {
  workerpoolOrders: PublishedWorkerpoolorder[];
  workerpoolMaxPrice: number;
  useVoucher: boolean;
  userVoucher?: VoucherInfo;
}) {
  if (workerpoolOrders.length === 0) {
    return null;
  }

  let eligibleWorkerpoolOrders = workerpoolOrders;
  let maxVoucherSponsoredAmount = 0; // may be safer to use bigint

  if (useVoucher) {
    if (!userVoucher) {
      throw new Error(
        'useVoucher === true but userVoucher is undefined? Hum...'
      );
    }
    // only voucher sponsored workerpoolorders
    eligibleWorkerpoolOrders = eligibleWorkerpoolOrders.filter(({ order }) =>
      userVoucher.sponsoredWorkerpools.includes(order.workerpool)
    );
    if (eligibleWorkerpoolOrders.length === 0) {
      throw new Error(
        'Found some workerpool orders but none can be sponsored by your voucher.'
      );
    }
    maxVoucherSponsoredAmount = bnToNumber(userVoucher.balance);
  }

  const [cheapestOrder] = eligibleWorkerpoolOrders.sort(
    (order1, order2) =>
      order1.order.workerpoolprice - order2.order.workerpoolprice
  );

  if (
    !cheapestOrder ||
    cheapestOrder.order.workerpoolprice >
      workerpoolMaxPrice + maxVoucherSponsoredAmount
  ) {
    return null;
  }
  return cheapestOrder.order;
}
