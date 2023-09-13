const { Buffer } = require('buffer');
const forge = require('node-forge');
const fetch = require('node-fetch');
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
  const ivBytes = encryptedContent.slice(0, 16);
  let ciphertextBytes = encryptedContent.slice(16);
  const key = forge.util.createBuffer(Buffer.from(encryptionKey, 'base64'));
  let decipher = forge.cipher.createDecipher('AES-CBC', key);

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
