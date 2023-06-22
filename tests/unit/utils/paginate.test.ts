import { autoPaginateRequest } from '../../../dist/utils/paginate';

describe('autoPaginateRequest', () => {
  it('should return an object with orders and total count when no more requests are present', async () => {
    const mockRequest = Promise.resolve({
      count: 2,
      orders: [{ id: 1 }, { id: 2 }],
      more: null,
    });

    const response = await autoPaginateRequest({ request: mockRequest });

    expect(response).toEqual({
      count: 2,
      orders: [{ id: 1 }, { id: 2 }],
    });
  });

  it('should recursively accumulate orders if more requests are present', async () => {
    let timesCalled = 0;

    const more = () => {
      timesCalled++;
      if (timesCalled === 1) {
        return Promise.resolve({
          count: 2,
          orders: [{ id: 3 }, { id: 4 }],
          more: more,
        });
      }
      return Promise.resolve({
        count: 2,
        orders: [{ id: 5 }, { id: 6 }],
        more: null,
      });
    };

    const mockRequest = Promise.resolve({
      count: 2,
      orders: [{ id: 1 }, { id: 2 }],
      more: more,
    });

    const response = await autoPaginateRequest({ request: mockRequest });

    expect(response).toEqual({
      count: 2,
      orders: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
      ],
    });
  });

  it('should return an object with empty orders and count as zero if request does not have orders', async () => {
    const mockRequest = Promise.resolve({
      count: 0,
      orders: [],
      more: null,
    });

    const response = await autoPaginateRequest({ request: mockRequest });

    expect(response).toEqual({
      count: 0,
      orders: [],
    });
  });
});
