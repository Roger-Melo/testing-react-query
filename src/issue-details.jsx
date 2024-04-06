import { Link, useLoaderData } from 'react-router-dom'

const IssueDetails = () => {
  const data = useLoaderData()
  console.log('data:', data)

  return (
    <>
      <Link to="/">Voltar</Link>
      <h2>{data.title}</h2>
      <p>{data.body}</p>
    </>
  )
}

export { IssueDetails }
