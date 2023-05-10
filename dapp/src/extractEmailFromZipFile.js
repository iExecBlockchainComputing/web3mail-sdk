const JSZip = require('jszip');
const fs = require('fs').promises;

async function extractEmailFromZipFile(zipPath) {
  if (typeof zipPath !== 'string') {
    throw new TypeError('The file path must be a string.');
  }
  if (!zipPath.endsWith('.zip')) {
    throw new Error('The provided file is not a .zip file.');
  }
  const buffer = await fs.readFile(zipPath);
  const zip = new JSZip();
  await zip.loadAsync(buffer);
  let emailContent;
  zip.forEach((relativePath, file) => {
    if (!file.dir && relativePath.includes('email')) {
      emailContent = file.async('string');
    }
  });
  if (!emailContent) {
    throw new Error('No email file was found in the zip.');
  }
  return emailContent;
}

module.exports = extractEmailFromZipFile;
