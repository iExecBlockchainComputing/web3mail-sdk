import { create } from 'kubo-rpc-client';
import { IPFS_UPLOAD_URL, DEFAULT_IPFS_GATEWAY } from '../config/config.js';

interface GetOptions {
  ipfsGateway?: string;
}
interface AddOptions extends GetOptions {
  ipfsNode?: string;
}

const get = async (
  cid,
  { ipfsGateway = DEFAULT_IPFS_GATEWAY }: GetOptions = {}
) => {
  const multiaddr = `/ipfs/${cid.toString()}`;
  const publicUrl = `${ipfsGateway}${multiaddr}`;
  const res = await fetch(publicUrl);
  if (!res.ok) {
    throw Error(`Failed to load content from ${publicUrl}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const add = async (
  content,
  {
    ipfsNode = IPFS_UPLOAD_URL,
    ipfsGateway = DEFAULT_IPFS_GATEWAY,
  }: AddOptions = {}
) => {
  // @ts-ignore
  const ipfsClient = create(ipfsNode);
  const { cid } = await ipfsClient.add(content);
  await get(cid.toString(), { ipfsGateway });
  return cid.toString();
};

export { add, get };
