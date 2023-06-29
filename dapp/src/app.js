const start = require('./sendEmail');

start().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
