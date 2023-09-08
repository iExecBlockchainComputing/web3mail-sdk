const { Buffer } = require('buffer');
const { forgeAes, util } = require('./forge-aes');

const DEFAULT_IPFS_GATEWAY = 'https://ipfs-gateway.v8-bellecour.iex.ec';

const downloadEncryptedContent = async (
  multiaddr,
  { ipfsGateway = DEFAULT_IPFS_GATEWAY } = {}
) => {
  const publicUrl = `${ipfsGateway}${multiaddr}`;
  const modifiedMultiaddr = publicUrl.replace('/p2p/', '/ipfs/');
  const res = await fetch(modifiedMultiaddr);
  if (!res.ok) {
    throw Error(`Failed to load content from ${publicUrl}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const decryptContent = (encryptedContent, encryptionKey) => {
  let [ivBytes, ciphertextBytes] = [
    encryptedContent.slice(0, 16),
    encryptedContent.slice(16),
  ];
  const key = util.createBuffer(Buffer.from(encryptionKey, 'base64'));
  let decipher = forgeAes.cipher.createDecipher('AES-CBC', key);

  decipher.start({ iv: util.createBuffer(ivBytes) });

  const CHUNK_SIZE = 10 * 1000 * 1000;
  let decryptedBuffer = Buffer.from([]);

  while (ciphertextBytes.length > 0) {
    const chunk = ciphertextBytes.slice(0, CHUNK_SIZE);
    ciphertextBytes = ciphertextBytes.slice(CHUNK_SIZE);
    decipher.update(util.createBuffer(chunk));
    decryptedBuffer = Buffer.concat([
      decryptedBuffer,
      Buffer.from(decipher.output.getBytes(), 'binary'),
    ]);
  }

  decipher.finish();

  decryptedBuffer = Buffer.concat([
    decryptedBuffer,
    Buffer.from(decipher.output.getBytes(), 'binary'),
  ]);

  // ensure that 'removedPaddingBuffer' contains only the original and meaningful content after decryption.
  const removedPaddingBuffer = removePadding(decryptedBuffer);

  const decryptedContentStr = Buffer.from(
    removedPaddingBuffer,
    'utf-8'
  ).toString();
  return decryptedContentStr;
};

const removePadding = (buffer) => {
  const paddingLength = buffer[buffer.length - 1]; // The last byte indicates the length of the padding
  if (paddingLength >= buffer.length || paddingLength === 0) {
    return buffer;
  }
  return buffer.slice(0, buffer.length - paddingLength); // Remove padding bytes
};

module.exports = { downloadEncryptedContent, decryptContent };
