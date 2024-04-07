const getIssueDetailsQuery = issueNumber => ({
  queryKey: ['issueDetails', { issueNumber }],
  queryFn: async () => fetch(`https://api.github.com/repos/frontendbr/vagas/issues/${issueNumber}`)
    .then(res => res.json())
    .then(data => ({ title: data.title, body: data.body }))
})

const issueDetailsLoader = queryClient => async ({ params }) => {
  const query = getIssueDetailsQuery(params.issueNumber)
  return queryClient.getQueryData(query.queryKey) ?? await queryClient.fetchQuery(query)
}

export { issueDetailsLoader, getIssueDetailsQuery }
