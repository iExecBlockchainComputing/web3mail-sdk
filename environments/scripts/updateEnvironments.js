import fs from "fs";
import { KNOWN_ENVS, KNOWN_KEYS } from "../common/utils.js";

const ENV_JSON = "environments.json";

const { ENV, KEY, VALUE } = process.env;

if (!KNOWN_ENVS.includes(ENV))
  throw Error(
    `unknown ENV "${ENV}", must be one of ${KNOWN_ENVS.map(
      (name) => `"${name}"`
    ).join(", ")}`
  );

if (!KNOWN_KEYS.includes(KEY))
  throw Error(
    `unknown KEY "${KEY}", must be one of ${KNOWN_KEYS.map(
      (name) => `"${name}"`
    ).join(", ")}`
  );

if (!VALUE) throw Error("missing value to update");

const env = JSON.parse(fs.readFileSync(ENV_JSON));

const initialValue = env[ENV][KEY];

env[ENV][KEY] = VALUE;

fs.writeFileSync(ENV_JSON, JSON.stringify(env, null, 2));

console.log(
  `replaced ${ENV}.${KEY} initial value (${initialValue}) by ${VALUE}`
);
