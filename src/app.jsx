import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'

const fetchIssues = activeLabels => {
  const labelsParam = activeLabels.length === 0
    ? ''
    : `&labels=${activeLabels.map(label => label.name).join(',')}`
  const perPageParam = 'per_page=10'
  return fetch(`https://api.github.com/repos/frontendbr/vagas/issues?${perPageParam}${labelsParam}`)
    .then(res => res.json())
    .then(data => {
      return {
        issues: data.map(issue => ({
          id: issue.id,
          state: issue.state,
          title: issue.title,
          createdAt: issue.created_at,
          author: { username: issue.user.login, avatar: issue.user.avatar_url },
          labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
          url: issue.html_url,
        }))
      }
    })
}

const fetchLabels = () => {
  const perPageParam = 'per_page=100'
  return fetch(`https://api.github.com/repos/frontendbr/vagas/labels?${perPageParam}`)
    .then(res => res.json())
    .then(data => data.map(label => ({ id: label.id, name: label.name, color: label.color })))
}

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

const IssuesList = ({ activeLabels, onClickLabel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    if (searchTerm.length > 0) {
      formRef.current.reset()
    }
  }, [searchTerm])

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
    staleTime: Infinity,
    retry: false
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
  const queryToBeDisplayed = searchedIssuesQuery.isSuccess ? searchedIssuesQuery.data?.issues : issuesQuery.data?.issues
  return (
    <div className="issuesListContainer">
      <h1>Vagas {searchedIssuesQuery.isSuccess && `com o termo "${searchTerm}": ${searchedIssuesQuery.data.totalCount}`}</h1>
      <SearchIssues
        searchedIssuesQuery={searchedIssuesQuery}
        onSearchIssues={searchIssues}
        clearSearchedIssues={clearSearchedIssues}
        formRef={formRef}
      />
      {isError && <p>{errorMessage}</p>}
      {isLoading && <p>Carregando informações...</p>}
      <ul className="issuesList">
        {queryToBeDisplayed?.map(issue =>
          <IssueItem key={issue.id} onClickLabel={onClickLabel} {...issue} />)}
      </ul>
    </div>
  )
}

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
  const perPageParam = 'per_page=10'
  const queryString = `?${perPageParam}&q=${encodeURIComponent(`${searchTerm} repo:frontendbr/vagas is:issue is:open`)}`
  return fetch(`https://api.github.com/search/issues${queryString}`)
    .then(res => res.json())
    .then(data => ({
      totalCount: data.total_count,
      issues: data.items.map(issue => ({
        id: issue.id,
        state: issue.state,
        title: issue.title,
        createdAt: issue.created_at,
        author: { username: issue.user.login, avatar: issue.user.avatar_url },
        labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
        url: issue.html_url,
      }))
    }))
}

const SearchIssues = ({ formRef, searchedIssuesQuery, onSearchIssues, clearSearchedIssues }) =>
  <div className="searchIssues">
    <form onSubmit={onSearchIssues} ref={formRef}>
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
  </div>

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
