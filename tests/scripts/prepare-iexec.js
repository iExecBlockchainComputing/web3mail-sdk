import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const disableCheckImplementedOnChain = async () => {
  const configModulePath = resolve(
    'node_modules/iexec/dist/esm/common/utils/config.js'
  );

  const configModule = await readFile(configModulePath, 'utf8');

  const OG_CODE_SNIPPET =
    'export const checkImplementedOnChain = (chainId, featureName) => {';

  const REPLACEMENT_CODE_SNIPPET =
    'export const checkImplementedOnChain = (chainId, featureName) => { return;';

  if (!configModule.includes(REPLACEMENT_CODE_SNIPPET)) {
    console.log('disabling checkImplementedOnChain implementation...');
    const patchedConfigModule = configModule.replace(
      OG_CODE_SNIPPET,
      REPLACEMENT_CODE_SNIPPET
    );

    await writeFile(configModulePath, patchedConfigModule, 'utf8');
  }
};

disableCheckImplementedOnChain();

