import Docker from 'dockerode';
import { DOCKER_IMAGE } from '../config/config.js';

const docker = new Docker();

export async function getDockerImageChecksum(): Promise<string | null> {
  if (!DOCKER_IMAGE) return 'No Docker image provided';

  // Pull image from Docker Hub if not exists
  await pullingDockerImage();

  try {
    // Inspect image
    const image = docker.getImage(DOCKER_IMAGE);
    const info = await image.inspect();

    // Extract the hash from the RepoDigest, if available
    const repoDigest = info.RepoDigests?.[0];
    if (repoDigest) {
      const hash = repoDigest.split('@')[1]?.split(':')[1];
      return hash ? '0x' + hash.toLocaleLowerCase() : null;
    } else {
      console.error(`RepoDigest not found in Docker image information`);
      return null;
    }
  } catch (err) {
    console.error(`Error inspecting image ${DOCKER_IMAGE}: ${err}`);
    return null;
  }
}

export async function getFingerprintFromScone(): Promise<string | null> {
  if (!DOCKER_IMAGE) return 'No Docker image provided';

  const sconeHash = '1'; // replace with actual SCONE_HASH if necessary

  // Pull image from Docker Hub if not exists
  await pullingDockerImage();

  // Run docker container
  let fingerprint = '';
  try {
    const container = await docker.createContainer({
      Image: DOCKER_IMAGE,
      Env: [`SCONE_HASH=${sconeHash}`],
      HostConfig: {
        AutoRemove: true,
      },
    });

    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    stream.on('data', (chunk: Buffer) => {
      fingerprint += chunk.toString();
    });

    stream.on('end', () => {
      // The log stream has ended
    });

    stream.on('error', (err: Error) => {
      console.error(`Error obtaining logs from container: ${err}`);
    });

    await container.wait();
  } catch (err) {
    console.error(`Error running image ${DOCKER_IMAGE}: ${err}`);
  }
  return fingerprint.toLocaleLowerCase() || null;
}

const pullingDockerImage = async () => {
  // Pull image from Docker Hub if not exists
  try {
    await new Promise((resolve, reject) => {
      docker.pull(DOCKER_IMAGE, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        docker.modem.followProgress(stream, (error, output) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(output);
        });
      });
    });
    console.log(`Pulled image ${DOCKER_IMAGE} successfully`);
  } catch (err) {
    console.error(`Error pulling image ${DOCKER_IMAGE}: ${err}`);
  }
};
