import { useQuery } from '@tanstack/react-query'

const fetchLabels = ({ organization, repository }) =>
  fetch(`https://api.github.com/repos/${organization}/${repository}/labels`)
    .then(res => res.json())
    .then(data => data.map(({ id, name, color }) => ({ id, name, color })))

const fetchIssues = ({ organization, repository }) =>
  fetch(`https://api.github.com/repos/${organization}/${repository}/issues`)
    .then(res => res.json())
    .then(data => {
      return data.map(({ id, state, title, created_at, user, labels, html_url }) => ({
        id,
        state,
        title,
        createdAt: created_at,
        author: { name: user.login, avatar: user.avatar_url },
        labels: labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
        url: html_url
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
        <span key={id} style={{ backgroundColor: `#${color}` }} className="label">{name}</span>)}
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

const LabelItem = ({ name, color }) =>
  <li>
    <span style={{ backgroundColor: `#${color}` }} className="label">{name}</span>
  </li>

const LabelsList = () => {
  const { isError, error, isLoading, data } = useQuery({
    queryKey: ['labels'],
    queryFn: () => fetchLabels({ organization: 'frontendbr', repository: 'vagas' }),
    refetchOnWindowFocus: false
  })

  return isError
    ? <p>{error.message}</p>
    : isLoading
      ? <p>Carregando informações...</p>
      : <ul className="labelsList">{data.map(label => <LabelItem key={label.id} {...label} />)}</ul>
}

const App = () =>
  <div className="app">
    <div>
      <h1>Vagas</h1>
      <IssuesList />
    </div>
    <div>
      <h2>Labels</h2>
      <LabelsList />
    </div>
  </div>

export { App }
