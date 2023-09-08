const forge = require('node-forge/lib/forge.js');
const aes = require('node-forge/lib/aes');
const util = require('node-forge/lib/util');
// importing forge modules has side effects on the forge object, make sure the import is not removed by tree-shaking
const forgeAes = forge;
forgeAes.aes = aes;

module.exports = { forgeAes, util };
