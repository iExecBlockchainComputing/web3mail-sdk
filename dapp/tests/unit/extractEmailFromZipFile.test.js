const extractEmailFromZipFile = require('../../src/extractEmailFromZipFile');
const path = require('path');

const fs = require('fs').promises;
const JSZip = require('jszip');

describe('extractEmailFromZipFile', () => {
  it('returns a valid email address for a valid .zip file', async () => {
    const zipPath = path.join(__dirname, '../_test_inputs_/data.zip');
    const result = await extractEmailFromZipFile(zipPath);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(result).toMatch(emailPattern);
  });

  it('throws an error for a non-existent file', async () => {
    const zipPath = path.join(__dirname, './non-existent-file.zip');
    await expect(extractEmailFromZipFile(zipPath)).rejects.toThrow(
      `ENOENT: no such file or directory, open '${zipPath}'`
    );
  });

  it('throws an error for a non-.zip file', async () => {
    const zipPath = path.join(__dirname, 'invalidZipFile.txt');
    await expect(extractEmailFromZipFile(zipPath)).rejects.toThrow(
      'The provided file is not a .zip file.'
    );
  });

  it('throws a type error for a non-string file path', async () => {
    const zipPath = 12345;
    await expect(extractEmailFromZipFile(zipPath)).rejects.toThrow(
      'The file path must be a string.'
    );
  });

  it('throws an error if no email file is found in the zip', async () => {
    const zip = new JSZip();
    zip.file('file1.txt', 'content1');
    zip.file('file2.txt', 'content2');
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, 'no-email.zip');
    await fs.writeFile(zipPath, zipBuffer);
    await expect(extractEmailFromZipFile(zipPath)).rejects.toThrow(
      'No email file was found in the zip.'
    );
    await fs.unlink(zipPath);
  });
});
