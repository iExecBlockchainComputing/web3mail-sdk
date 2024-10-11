export const WAIT_FOR_SUBGRAPH_INDEXING = 3_000;

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function waitForSubgraphIndexing() {
  return sleep(WAIT_FOR_SUBGRAPH_INDEXING);
}
