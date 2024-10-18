import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';
import { VoucherInfo } from 'iexec/IExecVoucherModule';
import {
  checkUserVoucher,
  filterWorkerpoolOrders,
} from '../../src/web3mail/sendEmail.models.js';

describe('sendEmail.models', () => {
  describe('checkUserVoucher', () => {
    describe('When user has NO voucher', () => {
      it('should throw an Error with the correct message', async () => {
        // --- GIVEN
        const userVoucher = undefined;

        expect(() =>
          checkUserVoucher({
            userVoucher,
          })
        ).toThrow(
          new Error(
            'Oops, it seems your wallet is not associated with any voucher. Check on https://builder-dashboard.iex.ec/'
          )
        );
      });
    });

    describe('When voucher is expired', () => {
      it('should throw an Error with the correct message', async () => {
        // --- GIVEN
        const userVoucher = {
          expirationTimestamp: Date.now() / 1000 - 60, // Expired 1min ago
        } as VoucherInfo;

        expect(() =>
          checkUserVoucher({
            userVoucher,
          })
        ).toThrow(
          new Error(
            'Oops, it seems your voucher has expired. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
          )
        );
      });
    });

    describe('When voucher has a balance equals to 0', () => {
      it('should throw an Error with the correct message', async () => {
        // --- GIVEN
        const userVoucher = {
          expirationTimestamp: Date.now() / 1000 + 3600, // Will expire in 1h
          balance: 0,
        } as VoucherInfo;

        expect(() =>
          checkUserVoucher({
            userVoucher,
          })
        ).toThrow(
          new Error(
            'Oops, it seems your voucher is empty. You might want to ask for a top up. Check on https://builder-dashboard.iex.ec/'
          )
        );
      });
    });
  });

  describe('filterWorkerpoolOrders()', () => {
    describe('When workerpool orders is an empty array', () => {
      it('should just answer with null', () => {
        // --- GIVEN
        const workerpoolOrders = [];

        // --- WHEN
        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
          useVoucher: false,
          userVoucher: undefined,
        });

        // --- THEN
        expect(foundOrder).toBeNull();
      });
    });

    describe('useVoucher === false', () => {
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
            workerpoolMaxPrice: 0, // <-- I want a free workerpool order
            useVoucher: false,
            userVoucher: undefined,
          });

          // --- THEN
          expect(foundOrder).toBeNull();
        });
      });

      describe('When one order is cheap enough', () => {
        it('should answer with it', () => {
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
            useVoucher: false,
            userVoucher: undefined,
          });

          // --- THEN
          expect(foundOrder).toBeTruthy();
          expect(foundOrder.workerpoolprice).toBe(1);
        });
      });
    });

    describe('useVoucher === true', () => {
      describe('When voucher balance is greater than asked maxPrice', () => {
        it('should answer with the cheapest order', () => {
          // --- GIVEN
          const userVoucher = {
            // balance: new BN(4), // Technically it should be a BN
            balance: 4,
          };
          const workerpoolOrders = [
            {
              order: {
                workerpoolprice: 3,
              },
            },
            {
              order: {
                workerpoolprice: 1,
              },
            },
          ] as PublishedWorkerpoolorder[];

          // --- WHEN
          const foundOrder = filterWorkerpoolOrders({
            workerpoolOrders,
            workerpoolMaxPrice: 0,
            useVoucher: true,
            userVoucher,
          });

          // --- THEN
          expect(foundOrder).toBeTruthy();
          expect(foundOrder.workerpoolprice).toBe(1);
        });
      });

      describe('When voucher balance is not enough but user can pay the rest', () => {
        it('should answer with the cheapest order', () => {
          // --- GIVEN
          const userVoucher = {
            // balance: new BN(4), // Technically it should be a BN
            balance: 2,
          };
          const workerpoolOrders = [
            {
              order: {
                workerpoolprice: 3,
              },
            },
          ] as PublishedWorkerpoolorder[];

          // --- WHEN
          const foundOrder = filterWorkerpoolOrders({
            workerpoolOrders,
            workerpoolMaxPrice: 1,
            useVoucher: true,
            userVoucher,
          });

          // --- THEN
          expect(foundOrder).toBeTruthy();
          expect(foundOrder.workerpoolprice).toBe(3);
        });
      });

      describe("When voucher balance is not enough AND user won't pay the rest", () => {
        it('should answer with the cheapest order', () => {
          // --- GIVEN
          const userVoucher = {
            // balance: new BN(4), // Technically it should be a BN
            balance: 2,
          };
          const workerpoolOrders = [
            {
              order: {
                workerpoolprice: 5,
              },
            },
          ] as PublishedWorkerpoolorder[];

          // --- WHEN
          const foundOrder = filterWorkerpoolOrders({
            workerpoolOrders,
            workerpoolMaxPrice: 1,
            useVoucher: true,
            userVoucher,
          });

          // --- THEN
          expect(foundOrder).toBeNull();
        });
      });
    });
  });
});
