import start from './sendEmail.js';

start().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
