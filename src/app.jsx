import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'

const fetchIssues = ({ activeLabels, currentPage }) => {
  const labelsParam = activeLabels.length === 0
    ? ''
    : `&labels=${activeLabels.map(label => label.name).join(',')}`
  const pageParam = `?page=${currentPage}`
  return fetch(`https://api.github.com/repos/frontendbr/vagas/issues${pageParam}${labelsParam}`)
    .then(async res => ({
      issues: await res.json(),
      pages: res.headers?.get('link')?.split(',').reduce((acc, str) => {
        const key = `${str.match(/rel="([^"]+)"/)[1]}Page`
        const value = +str.match(/page=(\d+)/)[1]
        return { ...acc, [key]: value }
      }, {})
    }))
    .then(data => ({
      ...data,
      issues: data.issues.map(issue => ({
        id: issue.id,
        state: issue.state,
        title: issue.title,
        createdAt: issue.created_at,
        author: { username: issue.user.login, avatar: issue.user.avatar_url },
        labels: issue.labels.map(label => ({ id: label.id, color: label.color, name: label.name })),
        url: issue.html_url
      }))
    }))
}

const fetchSearchedIssues = ({ searchTerm, activeLabels }) => {
  const labels = activeLabels.length > 0
    ? activeLabels.map(label => `label:${label.name}`).join(' ')
    : ''
  const queryString = '?q=' +
    encodeURIComponent(`${searchTerm} repo:frontendbr/vagas is:issue is:open ${labels}`)
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
        url: issue.html_url
      }))
    }))
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

const SearchIssues = ({ formRef, searchedIssuesQuery, onSearchIssues, onClearSearchedIssues }) =>
  <div className="searchIssues">
    <form ref={formRef} onSubmit={onSearchIssues}>
      <input
        disabled={searchedIssuesQuery.isLoading}
        type="search"
        name="inputSearchIssues"
        className="inputSearchIssues"
        placeholder="React"
        minLength={2}
        required
        autoFocus
      />
      <button disabled={searchedIssuesQuery.isLoading}>Pesquisar</button>
    </form>
    {searchedIssuesQuery.data && <button onClick={onClearSearchedIssues}>Limpar Pesquisa</button>}
  </div>

const IssuesList = ({ activeLabels, onClickLabel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const formRef = useRef(null)

  useEffect(() => {
    if (searchTerm.length > 0) {
      formRef.current.reset()
    }
  }, [searchTerm])

  const searchedIssuesQuery = useQuery({
    queryKey: ['searchedIssues', { searchTerm, activeLabels }],
    queryFn: () => fetchSearchedIssues({ searchTerm, activeLabels }),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
    enabled: !!searchTerm
  })

  const issuesQuery = useQuery({
    queryKey: [
      'issues',
      { activeLabels: activeLabels.map(({ name }) => name), currentPage },
      activeLabels
    ],
    queryFn: () => fetchIssues({ activeLabels, currentPage }),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
    placeholderData: keepPreviousData
  })

  const searchIssues = e => {
    e.preventDefault()
    const { inputSearchIssues } = e.target.elements
    setSearchTerm(inputSearchIssues.value)
  }

  const clearSearchedIssues = () => setSearchTerm('')
  const goToPreviousPage = () => setCurrentPage(prev => prev - 1)
  const goToNextPage = () => setCurrentPage(prev => prev + 1)

  const isLoading = issuesQuery.isLoading || searchedIssuesQuery.isLoading
  const isError = issuesQuery.isError || searchedIssuesQuery.isError
  const errorMessage = issuesQuery.error?.message || searchedIssuesQuery.error?.message
  const titleMessage = `com o termo "${searchTerm}": ${searchedIssuesQuery.data?.totalCount}`
  const dataToRender = searchedIssuesQuery.isSuccess
    ? searchedIssuesQuery.data.issues
    : issuesQuery.data?.issues

  return (
    <div className="issuesListContainer">
      <h1>Vagas {searchedIssuesQuery.isSuccess && titleMessage}</h1>
      <SearchIssues
        onSearchIssues={searchIssues}
        formRef={formRef}
        searchedIssuesQuery={searchedIssuesQuery}
        onClearSearchedIssues={clearSearchedIssues}
      />
      {isError && <p>{errorMessage}</p>}
      {isLoading && <p>Carregando informações...</p>}
      <ul className="issuesList">
        {dataToRender?.map(issue =>
          <IssueItem key={issue.id} onClickLabel={onClickLabel} {...issue} />)}
      </ul>
      <nav className="paginationNav">
        <ul className="pagination">
          <li>
            <button disabled={currentPage === 1} onClick={goToPreviousPage}>
              Anterior
            </button>
          </li>
          <li>
            <span>{currentPage}</span>
          </li>
          <li>
            <button
              disabled={issuesQuery.data && !issuesQuery.data.pages.nextPage}
              onClick={goToNextPage}
            >
              Próxima
            </button>
          </li>
        </ul>
      </nav>
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
