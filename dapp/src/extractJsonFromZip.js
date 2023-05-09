const JSZip = require("jszip");
const fs = require("fs").promises;

async function extractZipAndBuildJson(zipPath) {
  // Check if the provided path is a string
  if (typeof zipPath !== "string") {
    throw new TypeError("The file path must be a string.");
  }
  // Check if the provided file is a .zip file
  if (!zipPath.endsWith(".zip")) {
    throw new Error("The provided file is not a .zip file.");
  }
  const buffer = await fs.readFile(zipPath);
  const zip = new JSZip();
  await zip.loadAsync(buffer);
  const promises = [];
  const data = {};
  // Loop over each file in the zip
  zip.forEach((relativePath, file) => {
    // Check if the file is not a directory
    if (!file.dir) {
      // Create a promise that reads the file content as a string and adds it to the data object
      const promise = file.async("string").then((content) => {
        // Split the file path into an array of segments
        const pathSegments = relativePath.split("/");
        // Traverse the data object using the path segments to create or update keys and values
        let current = data;
        for (let i = 0; i < pathSegments.length - 1; i++) {
          // If the current path segment does not exist as a key in the data object, create an empty object as its value
          if (!(pathSegments[i] in current)) {
            current[pathSegments[i]] = {};
          }
          // Traverse to the next level of the data object using the current path segment as the key
          current = current[pathSegments[i]];
        }
        // Set the value of the last path segment to the file content
        current[pathSegments[pathSegments.length - 1]] = content;
      });
      promises.push(promise);
    }
  });
  await Promise.all(promises);
  const values = Object.values(data);
  if (values.length === 0) {
    return {};
  }
  return values[0];
}

module.exports = extractZipAndBuildJson;
