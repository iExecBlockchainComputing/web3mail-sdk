const { request, gql } = require('graphql-request');

// TODO: the method could return true if valid, false if invalid, null if no prior validation or unable to check
async function checkEmailPreviousValidation({
  datasetAddress,
  dappAddresses,
  pocoSubgraphUrl,
}) {
  // TODO: add check in bulk task
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

module.exports = {
  checkEmailPreviousValidation,
};
