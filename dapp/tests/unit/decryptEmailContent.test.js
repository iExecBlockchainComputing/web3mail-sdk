const { Wallet } = require('ethers');
const {
  decryptContent,
} = require('../../src/decrypt-email-content/cryptoDataUtils');
describe('decryptContent', () => {
  it('should decrypt content correctly', async () => {
    const { IExec, utils } = await import('iexec');
    const ethProvider = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec',
      Wallet.createRandom().privateKey
    );
    const iexec = new IExec({
      ethProvider,
    });

    const encryptionKey = iexec.dataset.generateEncryptionKey();
    const emailContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur fringilla orci in neque laoreet, nec dictum justo cursus. Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Maecenas non bibendum leo. 
`;
    const encryptedFile = await iexec.dataset
      .encrypt(Buffer.from(emailContent, 'utf8'), encryptionKey)
      .catch((e) => {
        throw new WorkflowError('Failed to encrypt API key', e);
      });

    const decryptedEmailContent = decryptContent(encryptedFile, encryptionKey);
    expect(decryptedEmailContent.length).toEqual(emailContent.length);
    expect(decryptedEmailContent).toEqual(emailContent);
  });
});
