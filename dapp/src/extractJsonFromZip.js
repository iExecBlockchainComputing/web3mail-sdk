const JSZip = require("jszip");
const fs = require("fs").promises;

async function extractZipAndBuildJson(zipPath) {
  const buffer = await fs.readFile(zipPath);
  const zip = new JSZip();
  await zip.loadAsync(buffer);
  const promises = [];
  const data = {};
  zip.forEach((relativePath, file) => {
    if (!file.dir) {
      const promise = file.async("string").then((content) => {
        const pathSegments = relativePath.split("/");
        let current = data;
        for (let i = 0; i < pathSegments.length - 1; i++) {
          if (!(pathSegments[i] in current)) {
            current[pathSegments[i]] = {};
          }
          current = current[pathSegments[i]];
        }
        current[pathSegments[pathSegments.length - 1]] = content;
      });
      promises.push(promise);
    }
  });
  await Promise.all(promises);
  return Object.values(data)[0];
}

module.exports = extractZipAndBuildJson;
