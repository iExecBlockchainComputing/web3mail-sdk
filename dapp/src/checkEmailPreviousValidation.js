const { request, gql } = require('graphql-request');

async function checkEmailPreviousValidation({
  datasetAddress,
  dappAddresses,
  pocoSubgraphUrl,
}) {
  // Optimisation : limiter le nombre de résultats et ajouter une pagination
  const query = gql`
    query checkSuccessfulTaskQuery($apps: [String!], $dataset: String!, $first: Int!) {
      tasks(
        first: $first
        where: {
          resultsCallback_not: "0x"
          status: "COMPLETED"
          deal_: { dataset: $dataset, app_in: $apps }
        }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        resultsCallback
      }
    }
  `;

  const variables = {
    apps: dappAddresses,
    dataset: datasetAddress.toLowerCase(),
    first: 10, // Limiter à 10 résultats maximum
  };

  try {
    const data = await request(pocoSubgraphUrl, query, variables);
    const tasks = data?.tasks || [];

    // Vérifier seulement le premier résultat valide trouvé
    for (const task of tasks) {
      const callback = task.resultsCallback?.toLowerCase();
      if (
        callback &&
        callback.startsWith('0x') &&
        callback.endsWith(
          '0000000000000000000000000000000000000000000000000000000000000001'
        )
      ) {
        return true; // Sortir dès qu'on trouve un résultat valide
      }
    }
    
    return false;
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
