const {
  downloadEncryptedContent,
} = require('../../../src/decrypt-email-content/cryptoDataUtils');
const DEFAULT_IPFS_GATEWAY = 'https://ipfs-gateway.v8-bellecour.iex.ec';

describe('downloadEncryptedContent', () => {
  it('should return the encrypted content', async () => {
    const content = `{"JSONPath":"$['rates']['GBP']","body":"","dataType":"number","dataset":"0x0000000000000000000000000000000000000000","headers":{},"method":"GET","url":"https://api.exchangerate.host/latest?base=USD&symbols=GBP"}`;
    const textEncoder = new TextEncoder();
    const actualContent = await textEncoder.encode(content);

    const multiaddr = '/ipfs/Qmb1JLTVp4zfRMPaori9htzzM9D3B1tG8pGbZYTRC1favA';
    const expectedContent = await downloadEncryptedContent(multiaddr);

    expect(actualContent).toEqual(expectedContent);
  });

  it('should throw an error if the content cannot be loaded', async () => {
    const multiaddr =
      '/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789invalid';
    await expect(downloadEncryptedContent(multiaddr)).rejects.toThrowError(
      `Failed to load content from ${DEFAULT_IPFS_GATEWAY}/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789invalid`
    );
  });
});
