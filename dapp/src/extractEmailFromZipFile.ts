import JSZip from 'jszip';
import fs from 'fs/promises';

export async function extractEmailFromZipFile(zipPath) {
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
