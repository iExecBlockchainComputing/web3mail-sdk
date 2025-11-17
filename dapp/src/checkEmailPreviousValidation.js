const { request, gql } = require('graphql-request');

/**
 * returns true if valid, false if invalid, undefined if no prior validation or unable to check
 */
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
    if (
      tasks.some((task) => {
        const callback = task.resultsCallback?.toLowerCase();
        return (
          callback ===
            '0x0000000000000000000000000000000000000000000000000000000000000001' || // 0b01 legacy format valid
          callback ===
            '0x0000000000000000000000000000000000000000000000000000000000000003' // 0b11 checked valid
        );
      })
    ) {
      return true;
    }
    if (
      tasks.some((task) => {
        const callback = task.resultsCallback?.toLowerCase();
        return (
          callback ===
          '0x0000000000000000000000000000000000000000000000000000000000000002' // 0b10 checked invalid
        );
      })
    ) {
      return false;
    }
    // no prior validation found
    return undefined;
  } catch (error) {
    console.error(
      'GraphQL error:',
      error.response?.errors || error.message || error
    );
    return undefined;
  }
}

module.exports = {
  checkEmailPreviousValidation,
};
