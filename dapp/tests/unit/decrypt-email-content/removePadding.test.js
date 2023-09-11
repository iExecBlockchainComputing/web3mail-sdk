const { Buffer } = require('buffer');
const {
  removePadding,
} = require('../../../src/decrypt-email-content/cryptoDataUtils'); // Replace with the actual path to your module file

describe('removePadding function', () => {
  it('should remove padding from a buffer', () => {
    const bufferWithPadding = Buffer.from([74, 65, 73, 74, 3, 3, 3]); // Simulated buffer with padding
    const result = removePadding(bufferWithPadding);
    expect(result).toEqual(Buffer.from([74, 65, 73, 74]));
  });

  it('should not remove padding when padding length is 0', () => {
    const bufferWithoutPadding = Buffer.from([1, 2, 3]); // No padding
    const result = removePadding(bufferWithoutPadding);
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it('should not remove padding when padding length exceeds buffer length', () => {
    const bufferWithInvalidPadding = Buffer.from([1, 2, 3, 4, 5]); // Invalid padding
    const result = removePadding(bufferWithInvalidPadding);
    expect(result).toEqual(Buffer.from([1, 2, 3, 4, 5]));
  });
});
