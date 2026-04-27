import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';

export function filterWorkerpoolOrders({
  workerpoolOrders,
  workerpoolMaxPrice,
}: {
  workerpoolOrders: PublishedWorkerpoolorder[];
  workerpoolMaxPrice: number;
}) {
  if (workerpoolOrders.length === 0) {
    return null;
  }

  const [cheapestOrder] = workerpoolOrders
    .slice()
    .sort(
      (order1, order2) =>
        order1.order.workerpoolprice - order2.order.workerpoolprice
    );

  if (
    !cheapestOrder ||
    cheapestOrder.order.workerpoolprice > workerpoolMaxPrice
  ) {
    return null;
  }
  return cheapestOrder.order;
}
