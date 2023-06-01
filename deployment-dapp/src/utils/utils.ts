import fs from 'fs/promises';

export async function getDockerImageChecksum(
  namespace: string,
  repository: string,
  tag: string
): Promise<string | null> {
  try {
    const manifest = await fetch(
      `https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags/${tag}`
    ).then((res) => res.json());
    const digest = manifest.digest as string;
    if (digest) {
      return digest.replace('sha256:', '0x');
    }
  } catch (err) {
    console.error(
      `Error inspecting image ${namespace}/${repository}:${tag}: ${err}`
    );
    return null;
  }
}

// read from previously generated file
export async function getSconeFingerprint(): Promise<string | null> {
  try {
    const fingerprint = await fs.readFile('../.scone-fingerprint', 'utf-8');
    return fingerprint.trim();
  } catch (err) {
    console.error(`Error reading .scone-fingerprint: ${err}`);
    return null;
  }
}
