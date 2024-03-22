import { useQuery } from '@tanstack/react-query'

const fetchIssues = ({ organization, repository }) =>
  fetch(`https://api.github.com/repos/${organization}/${repository}/issues`)
    .then(res => res.json())
    .then(data => {
      return data.map(issue => ({
        id: issue.id,
        state: issue.state,
        title: issue.title,
        createdAt: issue.created_at,
        author: { name: issue.user.login, avatar: issue.user.avatar_url },
        labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
        url: issue.html_url
      }))
    })

const getFormattedDate = date => {
  const [year, month, day] = date.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const IssueItem = ({ state, title, createdAt, labels, author, url }) =>
  <li>
    <span>{state}</span>
    <h3>
      <a href={url} target="_blank" rel="noreferrer">{title}</a>
    </h3>
    <div className="createdBy">
      <p>Criada em {getFormattedDate(createdAt)}, por {author.name}</p>
      <img src={author.avatar} alt={`Foto de ${author.name}`} />
    </div>
    {labels.length > 0 && (
      <p className="labels">Labels: {labels.map(({ id, color, name }) =>
        <span key={id} style={{ backgroundColor: `#${color}` }}>{name}</span>)}
      </p>
    )}
  </li>

const IssuesList = () => {
  const { isError, error, isLoading, data } = useQuery({
    queryKey: ['issues'],
    queryFn: () => fetchIssues({ organization: 'frontendbr', repository: 'vagas' }),
    refetchOnWindowFocus: false
  })

  return isError
    ? <p>{error.message}</p>
    : isLoading
      ? <p>Carregando informações...</p>
      : <ul className="issuesList">{data.map(issue => <IssueItem key={issue.id} {...issue} />)}</ul>
}

const App = () =>
  <>
    <h1>Vagas</h1>
    <IssuesList />
  </>

export { App }
