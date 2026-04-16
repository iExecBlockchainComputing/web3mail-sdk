const { Buffer } = require('buffer');
const forge = require('node-forge');
const fetch = require('node-fetch');

const resolveIpfsGatewayUrl = () => {
  const url = process.env.WEB3MAIL_IPFS_GATEWAY;
  if (url == null || String(url).trim() === '') {
    throw new Error('WEB3MAIL_IPFS_GATEWAY environment variable is not set.');
  }
  return String(url).trim();
};

const downloadEncryptedContent = async (
  multiaddr,
  { ipfsGateway = resolveIpfsGatewayUrl() } = {}
) => {
  const publicUrl = `${ipfsGateway}${multiaddr}`;
  const modifiedMultiaddr = publicUrl.replace('/p2p/', '/ipfs/');
  const res = await fetch(modifiedMultiaddr);
  if (!res.ok) {
    throw new Error(`Failed to load content from ${publicUrl}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const decryptContent = (encryptedContent, encryptionKey) => {
  const ivBytes = encryptedContent.slice(0, 16);
  let ciphertextBytes = encryptedContent.slice(16);
  const key = forge.util.createBuffer(Buffer.from(encryptionKey, 'base64'));
  const decipher = forge.cipher.createDecipher('AES-CBC', key);

  decipher.start({ iv: forge.util.createBuffer(ivBytes) });

  const CHUNK_SIZE = 10 * 1000 * 1000;
  let decryptedBuffer = Buffer.from([]);

  while (ciphertextBytes.length > 0) {
    // flush the decipher buffer
    decryptedBuffer = Buffer.concat([
      decryptedBuffer,
      Buffer.from(decipher.output.getBytes(), 'binary'),
    ]);
    const chunk = ciphertextBytes.slice(0, CHUNK_SIZE);
    ciphertextBytes = ciphertextBytes.slice(CHUNK_SIZE);
    decipher.update(forge.util.createBuffer(chunk));
  }

  decipher.finish();

  decryptedBuffer = Buffer.concat([
    decryptedBuffer,
    Buffer.from(decipher.output.getBytes(), 'binary'),
  ]);

  return decryptedBuffer.toString();
};
module.exports = { downloadEncryptedContent, decryptContent };
