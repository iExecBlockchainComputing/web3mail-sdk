# IExecDataProtector Subgraph Deployer

This repository serves as a subgraph deployer, enabling the deployment of a local IExecDataProtector subgraph to trigger the creation of protected data by IExecDataProtector on the local stack for e2e tests.

You can find the IExecDataProtector subgraph [here](https://github.com/iExecBlockchainComputing/dataprotector-sdk/tree/main/packages/subgraph)

## Build the subgraph

After editing the schema.graphql and subgraph.yaml files, run the following commands:

```bash
npm run codegen
npm run build
```

Next, write the ./src/bays.ts files to update the graph when new events appear

### Local deployment


```bash
npm run create-local
npm run deploy-local
```

### Test Subgraph API

The subgraph is deployed to: http://localhost:8000/subgraphs/name/DataProtector/graphql

Example GraphQL query:
```graphql
query MyQuery($requiredSchema: [String!]!, $start: Int!, $range: Int!) {
  protectedDatas(
    where: {transactionHash_not: "0x", schema_contains: $requiredSchema}
    skip: $start
    first: $range
    orderBy: creationTimestamp
    orderDirection: desc
  ) {
    id
    name
    owner {
      id
    }
    jsonSchema
    creationTimestamp
    checksum
    blockNumber
    multiaddr
    transactionHash
    schema {
      id
      path
      type
    }
  }
}
```

```graphql
Query Variables :

{
  "start": 0,
  "range": 1000,
  "requiredSchema": []
}
```