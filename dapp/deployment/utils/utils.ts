import { exec } from "child_process";
import * as util from "util";
import { DOCKER_IMAGE } from "../config/config";

const execPromisified = util.promisify(exec);

export async function getDockerImageChecksum(): Promise<string | null> {
  if (!DOCKER_IMAGE) return "No Docker image provided";

  // Pull image from Docker Hub if not exists
  await execPromisified(`docker pull ${DOCKER_IMAGE}`).catch(() => {
    console.error(`Error pulling image ${DOCKER_IMAGE}`);
  });

  // Inspect image
  let stdout;
  try {
    const result = await execPromisified(`docker inspect ${DOCKER_IMAGE}`);
    stdout = result.stdout;
  } catch (err) {
    console.error(`Error inspecting image ${DOCKER_IMAGE}: ${err}`);
    return null; // or you might want to return a specific value or throw the error
  }

  const info = JSON.parse(stdout);
  const repoDigest = info[0]?.RepoDigests?.[0];

  // Extract the hash from the RepoDigest, if available
  if (repoDigest) {
    const hash = repoDigest.split("@")[1]?.split(":")?.[1];
    return hash ? "0x" + hash : null;
  }

  return null;
}

export async function getFingerprintFromScone(): Promise<string> {
  if (!DOCKER_IMAGE) return "No Docker image provided";

  const sconeHash = "1"; // replace with actual SCONE_HASH if necessary

  // Pull image from Docker Hub if not exists
  await execPromisified(`docker pull ${DOCKER_IMAGE}`).catch(() => {
    console.error(`Error pulling image ${DOCKER_IMAGE}`);
  });

  // Run docker container
  let fingerprint;
  try {
    const result = await execPromisified(
      `docker run --rm -e SCONE_HASH=${sconeHash} ${DOCKER_IMAGE}`
    );
    fingerprint = result.stdout;
  } catch (err) {
    console.error(`Error running image ${DOCKER_IMAGE}: ${err}`);
    return ""; // or you might want to rethrow the error or return a specific value
  }
  return fingerprint;
}

