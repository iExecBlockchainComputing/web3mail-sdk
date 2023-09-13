const {
  decryptContent,
  downloadEncryptedContent,
} = require('../../src/decryptEmailContent');
describe('decryptContent', () => {
  it('should decrypt content correctly', async () => {
    const { IExec } = await import('iexec');

    const iexec = new IExec({
      ethProvider: 'bellecour',
    });

    const encryptionKey = iexec.dataset.generateEncryptionKey();
    const emailContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur fringilla orci in neque laoreet, nec dictum justo cursus. Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Maecenas non bibendum leo. 
`;
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(emailContent, 'utf8'), encryptionKey)
      .catch((e) => {
        throw new WorkflowError('Failed to encrypt email content', e);
      });

    const decryptedEmailContent = decryptContent(encryptedFile, encryptionKey);
    expect(decryptedEmailContent.length).toEqual(emailContent.length);
    expect(decryptedEmailContent).toEqual(emailContent);
  });
});
const DEFAULT_IPFS_GATEWAY = 'https://ipfs-gateway.v8-bellecour.iex.ec';
const IPFS_UPLOAD_URL = '/dns4/ipfs-upload.v8-bellecour.iex.ec/https';

describe('downloadEncryptedContent', () => {
  it('should return the encrypted content', async () => {
    const { create } = await import('kubo-rpc-client');
    const ipfsClient = create({ url: IPFS_UPLOAD_URL });
    const content =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sagittis, ipsum sed aliquet consequat, justo dolor venenatis metus, sit amet tempus ligula odio at libero. Suspendisse potenti. Praesent lacinia ex eu nibh scelerisque, vel pharetra elit ullamcorper. Vivamus vel tristique urna. Proin a semper lectus. ';
    const { cid } = await ipfsClient.add(content);
    const multiaddr = `/ipfs/${cid}`;
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
