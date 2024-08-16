// reexport environments.json as es module
import { createRequire } from 'module';
import { KNOWN_ENVS } from '../common/utils';

export const environments = createRequire(import.meta.url)(
  '../environments.json'
);

export const getEnvironment = (env) => {
  if (!KNOWN_ENVS.includes(env)) {
    throw Error(`Unknown environment ${env}`);
  }
  return environments[env];
};
