import { Link, useLoaderData } from 'react-router-dom'
import { parse } from 'marked'
import DOMPurify from 'dompurify'

const IssueDetails = () => {
  const data = useLoaderData()
  return (
    <>
      <Link to="/">Voltar</Link>
      <h2>{data.title}</h2>
      <main dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parse(data.body)) }} />
    </>
  )
}

export { IssueDetails }
