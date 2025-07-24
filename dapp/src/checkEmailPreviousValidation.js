import { request, gql } from 'graphql-request';

async function checkEmailPreviousValidation({ datasetAddress, dappAddresses }) {
  const pocoSubgraphUrl =
    'https://thegraph.bellecour.iex.ec/subgraphs/name/bellecour/poco-v5';

  const query = gql`
    query checkSuccessfulTaskQuery($apps: [String!], $dataset: String!) {
      tasks(
        where: {
          resultsCallback_not: "0x"
          status: "COMPLETED"
          deal_: { dataset: $dataset, app_in: $apps }
        }
      ) {
        resultsCallback
      }
    }
  `;

  const variables = {
    apps: dappAddresses,
    dataset: datasetAddress.toLowerCase(),
  };

  try {
    const data = await request(pocoSubgraphUrl, query, variables);
    const tasks = data?.tasks || [];

    return tasks.some((task) => {
      const callback = task.resultsCallback?.toLowerCase();
      return (
        callback &&
        callback.startsWith('0x') &&
        callback.endsWith(
          '0000000000000000000000000000000000000000000000000000000000000001'
        )
      );
    });
  } catch (error) {
    console.error(
      'GraphQL error:',
      error.response?.errors || error.message || error
    );
    return false;
  }
}

export default checkEmailPreviousValidation;
