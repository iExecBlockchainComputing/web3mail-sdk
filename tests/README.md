## Local test stack setup

Before running tests locally, you must configure and start the local test stack.

### 1. Start the test stack

To start the test stack, including the preparation of the test environment, use the following command:

```bash
npm run start-test-stack
```

This command will generate the necessary environment variables for the test stack and then start all the services defined in the `docker-compose.yml` file.

### 2. Run local tests

```bash
npm run test
```

### 3. Stop the test stack

To stop the test stack and remove all volumes and orphaned containers, run:

```bash
npm run stop-test-stack
```

### Services

The local test stack includes the following services:

- **bellecour-fork:** a blockchain node for testing
- **sms:** iExec Secret Management Service (iExec SMS)
- **result-proxy-mongo:** mongoDB instance to persist data for the result proxy
- **ipfs:** IPFS node for storing and retrieving task results
- **result-proxy:** result proxy for storing iExec task results on IPFS
- **market-mongo:** mongoDB instance for iExec market watcher
- **market-redis:** redis instance for the iExec market watcher
- **market-watcher:** market watcher service for monitoring iExec market activities
- **market-api:** market API service for interacting with the iExec market

### Note

Make sure Docker and Docker Compose are installed on your system before running the commands.
