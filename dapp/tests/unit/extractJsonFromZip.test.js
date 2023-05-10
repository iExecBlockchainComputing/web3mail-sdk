const extractZipAndBuildJson = require('../../src/extractJsonFromZip');
const path = require('path');

const fs = require('fs').promises;
const JSZip = require('jszip');

describe('extractZipAndBuildJson', () => {
  it('returns an object containing email for a valid .zip file', async () => {
    const zipPath = path.join(
      __dirname,
      '../_test_inputs_/myProtectedData.zip'
    );
    const result = await extractZipAndBuildJson(zipPath);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('email');
  });

  it('throws an error for a non-existent file', async () => {
    const zipPath = path.join(__dirname, './non-existent-file.zip');
    await expect(extractZipAndBuildJson(zipPath)).rejects.toThrow(
      `ENOENT: no such file or directory, open '${zipPath}'`
    );
  });

  it('throws an error for a non-.zip file', async () => {
    const zipPath = path.join(__dirname, 'invalidZipFile.txt');
    await expect(extractZipAndBuildJson(zipPath)).rejects.toThrow(
      'The provided file is not a .zip file.'
    );
  });

  it('throws a type error for a non-string file path', async () => {
    const zipPath = 12345;
    await expect(extractZipAndBuildJson(zipPath)).rejects.toThrow(
      'The file path must be a string.'
    );
  });

  it('returns an empty object for a valid .zip file with no files', async () => {
    const zip = new JSZip();
    const emptyZipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, 'empty.zip');
    await fs.writeFile(zipPath, emptyZipBuffer);
    const expectedData = {};
    const actualData = await extractZipAndBuildJson(zipPath);
    expect(actualData).toEqual(expectedData);
    await fs.unlink(zipPath);
  });

  it('returns an empty object for a valid .zip file with only directories', async () => {
    const zip = new JSZip();
    zip.folder('directory1');
    zip.folder('directory2');
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, 'only-directories.zip');
    await fs.writeFile(zipPath, zipBuffer);
    const expectedData = {};
    const actualData = await extractZipAndBuildJson(zipPath);
    expect(actualData).toEqual(expectedData);
    await fs.unlink(zipPath);
  });
});
