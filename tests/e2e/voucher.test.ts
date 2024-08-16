// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { IExec } from 'iexec';
import {
  createVoucher,
  createVoucherType,
  getRandomAddress,
  getTestIExecOption,
  getTestWeb3SignerProvider,
  timeouts,
} from '../test-utils.js';
import 'dotenv/config';

const { ENV } = process.env;

// TODO: enable tests for other env once the voucher is deployed
if (ENV === 'bellecour-fork') {
  describe('voucher test utils', () => {
    test(
      'createVoucherType should create a voucherType and return the id',
      async () => {
        const voucherTypeId = await createVoucherType({
          description: 'test voucher type',
          duration: 42,
        });
        expect(typeof voucherTypeId).toBe('bigint');
      },
      timeouts.createVoucherType
    );
    test(
      'createVoucher should create a voucher and publish workerpool orders',
      async () => {
        const owner = getRandomAddress();
        const voucherTypeId = await createVoucherType();

        await createVoucher({
          owner,
          voucherType: voucherTypeId,
          value: 48,
        });

        const iexec = new IExec(
          { ethProvider: getTestWeb3SignerProvider() },
          getTestIExecOption()
        );

        const debugWorkerpoolOrderbook =
          await iexec.orderbook.fetchWorkerpoolOrderbook({
            workerpool: 'debug-v8-bellecour.main.pools.iexec.eth',
            minTag: ['tee', 'scone'],
            requester: owner,
            isRequesterStrict: true,
          });

        expect(debugWorkerpoolOrderbook.count).toBeGreaterThan(0);
      },
      timeouts.createVoucher
    );
  });
} else {
  console.log(`Voucher not yet deployed in [${ENV}] environment`);
  test('placeholder test', () => {
    expect(true).toBe(true);
  });
}
