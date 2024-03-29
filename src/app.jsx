import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const getParametrizedIssues = data => data.map(issue => ({
  id: issue.id,
  state: issue.state,
  title: issue.title,
  createdAt: issue.created_at,
  author: { username: issue.user.login, avatar: issue.user.avatar_url },
  labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
  url: issue.html_url
}))

const fetchIssues = activeLabels => {
  const labelsParam = activeLabels.length === 0
    ? ''
    : `?labels=${activeLabels.map(label => label.name).join(',')}`
  return fetch(`https://api.github.com/repos/frontendbr/vagas/issues${labelsParam}`)
    .then(res => res.json())
    .then(getParametrizedIssues)
}

const fetchLabels = () =>
  fetch('https://api.github.com/repos/frontendbr/vagas/labels?per_page=100')
    .then(res => res.json())
    .then(data => data.map(label => ({ id: label.id, name: label.name, color: label.color })))

const getFormattedDate = date => {
  const [year, month, day] = date.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const Label = ({ isActive = false, label, onClickLabel }) =>
  <button
    onClick={() => onClickLabel(label)}
    className={`label ${isActive ? 'activeLabel' : ''}`}
    style={{ backgroundColor: `#${label.color}` }}
  >
    {label.name}
  </button>

const IssueItem = ({ state, title, createdAt, labels, author, url, onClickLabel }) =>
  <li>
    <span>{state}</span>
    <h3>
      <a href={url} target="_blank" rel="noreferrer">{title}</a>
    </h3>
    <div className="createdBy">
      <p>Criada em {getFormattedDate(createdAt)}, por {author.username}</p>
      <img src={author.avatar} alt={`Foto de ${author.username}`} />
    </div>
    {labels.length > 0 && (
      <p>Labels: {labels.map(label =>
        <Label key={label.id} onClickLabel={onClickLabel} label={label} />)}
      </p>
    )}
  </li>
{/* TODO: resetar form após envio */ }
const IssuesList = ({ activeLabels, onClickLabel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const searchedIssuesQuery = useQuery({
    queryKey: ['searchedIssues', { searchTerm }],
    queryFn: () => fetchSearchedIssues(searchTerm),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    enabled: !!searchTerm
  })

  const issuesQuery = useQuery({
    queryKey: ['issues', { activeLabels: activeLabels.map(({ name }) => name) }, activeLabels],
    queryFn: () => fetchIssues(activeLabels),
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })

  const searchIssues = e => {
    e.preventDefault()
    const { inputSearchIssues } = e.target.elements
    setSearchTerm(inputSearchIssues.value)
  }

  const clearSearchedIssues = () => setSearchTerm('')

  const isError = issuesQuery.isError || searchedIssuesQuery.isError
  const errorMessage = issuesQuery.error?.message || searchedIssuesQuery.error?.message
  const isLoading = issuesQuery.isLoading || searchedIssuesQuery.isLoading
  const queryToBeDisplayed = searchedIssuesQuery.isSuccess ? searchedIssuesQuery : issuesQuery

  return (
    <div className="issuesListContainer">
      <h1>Vagas {searchedIssuesQuery.isSuccess && `com o termo "${searchTerm}"`}</h1>
      <SearchIssues
        searchedIssuesQuery={searchedIssuesQuery}
        onSearchIssues={searchIssues}
        clearSearchedIssues={clearSearchedIssues}
      />
      {isError && <p>{errorMessage}</p>}
      {isLoading && <p>Carregando informações...</p>}
      <ul className="issuesList">
        {queryToBeDisplayed.data?.map(issue =>
          <IssueItem key={issue.id} onClickLabel={onClickLabel} {...issue} />)}
      </ul>
    </div>
  )
}

/*
return (
    <div>
      <form></form>
      <h2>Issues List</h2>
      
      {issuesQuery.isLoading ? (
        <p>Loading...</p>
      ) : searchQuery.fetchStatus === "idle" &&
        searchQuery.isLoading === true ? (
        <ul className="issues-list">
          {issuesQuery.data.map((issue) => (
            <IssueItem
              key={issue.id}
              title={issue.title}
              number={issue.number}
              assignee={issue.assignee}
              commentCount={issue.comments.length}
              createdBy={issue.createdBy}
              createdDate={issue.createdDate}
              labels={issue.labels}
              status={issue.status}
            />
          ))}
        </ul>
      ) : (
        <>
          <h2>Search Results</h2>
          {searchQuery.isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>{searchQuery.data.count} Results</p>
              <ul className="issues-list">
                {searchQuery.data.items.map((issue) => (
                  <IssueItem
                    key={issue.id}
                    title={issue.title}
                    number={issue.number}
                    assignee={issue.assignee}
                    commentCount={issue.comments.length}
                    createdBy={issue.createdBy}
                    createdDate={issue.createdDate}
                    labels={issue.labels}
                    status={issue.status}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
*/

const LabelsList = ({ activeLabels, onClickLabel }) => {
  const { isError, isLoading, isSuccess, error, data } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })

  return (
    <div className="labelsListContainer">
      <h2>Labels</h2>
      {isError && <p>{error.message}</p>}
      {isLoading && <p>Carregando informações...</p>}
      {isSuccess && (
        <ul className="labelsList">
          {data.map(label =>
            <Label
              key={label.id}
              isActive={activeLabels.some(activeLabel => label.id === activeLabel.id)}
              label={label}
              activeLabels={activeLabels}
              onClickLabel={onClickLabel}
            />
          )}
        </ul>
      )}
    </div>
  )
}

const fetchSearchedIssues = searchTerm => {
  const queryString = '?q=' + encodeURIComponent(`${searchTerm} repo:frontendbr/vagas is:issue is:open`)
  return fetch(`https://api.github.com/search/issues${queryString}`)
    .then(res => res.json())
    .then(data => getParametrizedIssues(data.items))
}

const SearchIssues = ({ searchedIssuesQuery, onSearchIssues, clearSearchedIssues }) =>
  <>
    <form onSubmit={onSearchIssues}>
      <input
        disabled={searchedIssuesQuery?.isLoading}
        type="search"
        name="inputSearchIssues"
        className="inputSearchIssues"
        placeholder="React"
        minLength={2}
        required
        autoFocus
      />
      <button disabled={searchedIssuesQuery?.isLoading}>Pesquisar</button>
    </form>
    {searchedIssuesQuery.data && <button onClick={clearSearchedIssues}>Limpar Pesquisa</button>}
  </>

const App = () => {
  const [activeLabels, setActiveLabels] = useState([])
  const markAsActive = label => setActiveLabels(prev => {
    const isAlreadyActive = prev.some(prevLabel => prevLabel.id === label.id)
    return isAlreadyActive ? prev.filter(prevLabel => prevLabel.id !== label.id) : [...prev, label]
  })

  return (
    <div className="app">
      <IssuesList activeLabels={activeLabels} onClickLabel={markAsActive} />
      <LabelsList activeLabels={activeLabels} onClickLabel={markAsActive} />
    </div>
  )
}

export { App }
