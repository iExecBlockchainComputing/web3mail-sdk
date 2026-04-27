import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';
import { filterWorkerpoolOrders } from '../../src/web3mail/sendEmail.models.js';

describe('sendEmail.models', () => {
  describe('filterWorkerpoolOrders()', () => {
    describe('When workerpool orders is an empty array', () => {
      it('should answer with null', () => {
        // --- GIVEN
        const workerpoolOrders = [];

        // --- WHEN
        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
        });

        // --- THEN
        expect(foundOrder).toBeNull();
      });
    });

    describe('When all orders are too expensive', () => {
      it('should answer with null', () => {
        // --- GIVEN
        const workerpoolOrders = [
          {
            order: {
              workerpoolprice: 1,
            },
          },
          {
            order: {
              workerpoolprice: 2,
            },
          },
        ] as PublishedWorkerpoolorder[];

        // --- WHEN
        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
        });

        // --- THEN
        expect(foundOrder).toBeNull();
      });
    });

    describe('When one order is cheap enough', () => {
      it('should answer with the cheapest one', () => {
        // --- GIVEN
        const workerpoolOrders = [
          {
            order: {
              workerpoolprice: 1,
            },
          },
          {
            order: {
              workerpoolprice: 2,
            },
          },
        ] as PublishedWorkerpoolorder[];

        // --- WHEN
        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 1,
        });

        // --- THEN
        expect(foundOrder).not.toBeNull();
        expect(foundOrder!.workerpoolprice).toBe(1);
      });
    });
  });
});
