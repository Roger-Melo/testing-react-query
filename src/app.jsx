import { useQuery } from '@tanstack/react-query'

const fetchIssues = () =>
  fetch('https://api.github.com/repos/frontendbr/vagas/issues')
    .then(res => res.json())
    .then(data => data.map(issue => ({
      id: issue.id,
      state: issue.state,
      title: issue.title,
      createdAt: issue.created_at,
      author: { username: issue.user.login, avatar: issue.user.avatar_url },
      labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
      url: issue.html_url
    })))

const fetchLabels = () =>
  fetch('https://api.github.com/repos/frontendbr/vagas/labels')
    .then(res => res.json())
    .then(data => data.map(label => ({ id: label.id, name: label.name, color: label.color })))

const getFormattedDate = date => {
  const [year, month, day] = date.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const Label = ({ color, name }) =>
  <button className="label" style={{ backgroundColor: `#${color}` }}>{name}</button>

const IssueItem = ({ state, title, createdAt, labels, author, url }) =>
  <li>
    <span>{state}</span>
    <h3>
      <a href={url} target="_blank" rel="noreferrer">{title}</a>
    </h3>
    <div className="createdBy">
      <p>Criada em {getFormattedDate(createdAt)}, por {author.username}</p>
      <img src={author.avatar} alt={`Foto de ${author.username}`} />
    </div>
    {labels.length > 0 && <p>Labels: {labels.map(label => <Label key={label.id} {...label} />)}</p>}
  </li>

const IssuesList = () => {
  const { isError, isLoading, isSuccess, error, data } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })

  return (
    <div>
      {isError && <p>{error.message}</p>}
      {isLoading && <p>Carregando informações...</p>}
      {isSuccess && (
        <>
          <h1>Vagas</h1>
          <ul className="issuesList">
            {data.map(issue => <IssueItem key={issue.id} {...issue} />)}
          </ul>
        </>
      )}
    </div>
  )
}

const LabelsList = () => {
  const { isError, isLoading, isSuccess, error, data } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })

  return (
    <div>
      {isError && <p>{error.message}</p>}
      {isLoading && <p>Carregando informações...</p>}
      {isSuccess && (
        <>
          <h2>Labels</h2>
          <ul className="labelsList">
            {data.map(label => <Label key={label.id} {...label} />)}
          </ul>
        </>
      )}
    </div>
  )
}

const App = () =>
  <div className="app">
    <IssuesList />
    <LabelsList />
  </div>

export { App }
