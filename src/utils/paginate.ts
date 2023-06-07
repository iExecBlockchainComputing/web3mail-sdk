export const autoPaginateRequest = async (
  { request },
  { orders = [] } = {}
) => {
  const res = await request;
  const totalCount = res.count;
  if (res.orders.length > 0) {
    orders.push(...res.orders);
    if (res.more && typeof res.more === 'function') {
      return autoPaginateRequest(
        {
          request: res.more(),
        },
        { orders }
      );
    }
  }
  return { orders, count: totalCount };
};
