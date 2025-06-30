import { IExecWeb3mail } from '../../src/index.js';

describe('When instantiating SDK without a signer', () => {
  describe('When calling a write method', () => {
    it('should throw an error for unauthorized method', async () => {
      // --- GIVEN
      const web3mail = new IExecWeb3mail();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      await web3mail['init']();

      // --- WHEN/THEN
      await expect(web3mail.fetchMyContacts()).rejects.toThrow(
        'Unauthorized method. Please log in with your wallet, you must set a valid provider with a signer.'
      );
    });
  });
});
