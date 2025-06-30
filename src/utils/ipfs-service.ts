import { create } from 'kubo-rpc-client';

interface GetOptions {
  ipfsGateway?: string;
}
interface AddOptions extends GetOptions {
  ipfsNode?: string;
}

const get = async (
  cid,
  { ipfsGateway }: GetOptions = {}
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
    ipfsNode,
    ipfsGateway,
  }: AddOptions = {}
) => {
  const ipfsClient = create(ipfsNode);
  const { cid } = await ipfsClient.add(content);
  await get(cid.toString(), { ipfsGateway });
  return cid.toString();
};

export { add, get };
