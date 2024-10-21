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

export function checkUserVoucher({
  userVoucher,
}: {
  userVoucher: VoucherInfo;
}) {
  if (Number(userVoucher.expirationTimestamp) < Date.now() / 1000) {
    throw new Error(
      'Oops, it seems your voucher has expired. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
    );
  }

  if (userVoucher.balance === 0) {
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

  if (!useVoucher) {
    const desiredPriceWorkerpoolOrderbook = workerpoolOrders.filter(
      (order) => order.order.workerpoolprice <= workerpoolMaxPrice
    );
    if (desiredPriceWorkerpoolOrderbook.length === 0) {
      return null;
    }

    // We take a random workerpool order? Why not the cheapest one?
    const randomIndex = Math.floor(
      Math.random() * desiredPriceWorkerpoolOrderbook.length
    );
    const desiredPriceWorkerpoolOrder =
      desiredPriceWorkerpoolOrderbook[randomIndex].order;
    return desiredPriceWorkerpoolOrder;
  }

  if (useVoucher && !userVoucher) {
    throw new Error('useVoucher === true but userVoucher is undefined? Hum...');
  }

  const onlySponsoredWorkerpools = workerpoolOrders.filter(
    (workerpoolOrder) => {
      return userVoucher.sponsoredWorkerpools.includes(
        workerpoolOrder.order.workerpool
      );
    }
  );
  if (onlySponsoredWorkerpools.length === 0) {
    return null;
  }

  const sortedWorkerpoolOrders = onlySponsoredWorkerpools.sort(
    (order1, order2) => {
      return order1.order.workerpoolprice - order2.order.workerpoolprice;
    }
  );
  const cheapestWorkerpoolOrder = sortedWorkerpoolOrders[0];

  // If there is enough balance on the voucher -> good
  if (
    Number(userVoucher.balance) >= cheapestWorkerpoolOrder.order.workerpoolprice
  ) {
    return cheapestWorkerpoolOrder.order;
  }

  // If there is some usable balance on the voucher + user accepts to pay for the rest -> good
  if (
    Number(userVoucher.balance) + workerpoolMaxPrice >=
    cheapestWorkerpoolOrder.order.workerpoolprice
  ) {
    return cheapestWorkerpoolOrder.order;
  }

  // If not enough money -> bad
  throw new Error(
    'Oops, it seems your voucher balance is not enough to cover the worker price. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
  );
}