import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'

const fetchIssues = ({ currentPage, searchTerm = '', activeLabels }) => {
  const labels = activeLabels.length > 0
    ? activeLabels.map(label => `label:${label.name}`).join(' ')
    : ''
  const queryString = `?per_page=10&page=${currentPage}&q=` +
    encodeURIComponent(`${searchTerm} repo:frontendbr/vagas is:issue is:open sort:created-desc ${labels}`)
  return fetch(`https://api.github.com/search/issues${queryString}`)
    .then(async res => {
      const data = await res.json()
      return ({
        issues: data.items,
        totalCount: data.total_count,
        pages: res.headers?.get('link')?.split(',').reduce((acc, str) => {
          const key = `${str.match(/rel="([^"]+)"/)[1]}Page`
          const value = +str.match(/\bpage=(\d+)/)[1]
          return { ...acc, [key]: value }
        }, {})
      })
    })
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

const SearchIssues = ({ isASearch, formRef, issuesQuery, onSearchIssues, onClearSearchedIssues }) =>
  <div className="searchIssues">
    <form ref={formRef} onSubmit={onSearchIssues}>
      <input
        disabled={issuesQuery.isLoading}
        type="search"
        name="inputSearchIssues"
        className="inputSearchIssues"
        placeholder="React"
        minLength={2}
        required
        autoFocus
      />
      <button disabled={issuesQuery.isLoading}>Pesquisar</button>
    </form>
    {isASearch && <button onClick={onClearSearchedIssues}>Limpar Pesquisa</button>}
  </div>

const Pagination = ({ queryToPaginate, currentPage, onClickPreviousPage, onClickNextPage }) =>
  <nav className="paginationNav">
    <ul className="pagination">
      <li>
        <button disabled={currentPage === 1} onClick={onClickPreviousPage}>Anterior</button>
      </li>
      <li>
        <span>{currentPage}</span>
      </li>
      <li>
        <button
          disabled={queryToPaginate.data && !queryToPaginate.data.pages?.nextPage}
          onClick={onClickNextPage}
        >
          Próxima
        </button>
      </li>
    </ul>
  </nav>

const IssuesList = ({ currentPage, activeLabels, onClickLabel, onClickPreviousPage, onClickNextPage, onResetCurrentPage }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    if (searchTerm.length > 0) {
      formRef.current.reset()
    }
  }, [searchTerm])

  const issuesQuery = useQuery({
    queryKey: ['issues', { searchTerm, activeLabels, currentPage }],
    queryFn: () => fetchIssues({ currentPage, searchTerm, activeLabels }),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false
  })

  const searchIssues = e => {
    e.preventDefault()
    const { inputSearchIssues } = e.target.elements
    setSearchTerm(inputSearchIssues.value)
    onResetCurrentPage()
  }

  const isASearch = searchTerm.length > 0
  const clearSearchedIssues = () => setSearchTerm('')
  const titleMessage = `com o termo "${searchTerm}": ${issuesQuery.data?.totalCount}`

  return (
    <div className="issuesListContainer">
      <h1>Vagas {isASearch && !issuesQuery.isLoading && titleMessage}</h1>
      <SearchIssues
        isASearch={isASearch}
        onSearchIssues={searchIssues}
        formRef={formRef}
        issuesQuery={issuesQuery}
        onClearSearchedIssues={clearSearchedIssues}
      />
      {issuesQuery.isError && <p>{issuesQuery.error.message}</p>}
      {issuesQuery.isLoading && <p>Carregando informações...</p>}
      {issuesQuery.isSuccess && (
        <>
          <ul className="issuesList">
            {issuesQuery.data.issues.map(issue =>
              <IssueItem key={issue.id} onClickLabel={onClickLabel} {...issue} />)}
          </ul>
          <Pagination
            queryToPaginate={issuesQuery}
            currentPage={currentPage}
            onClickPreviousPage={onClickPreviousPage}
            onClickNextPage={onClickNextPage}
          />
        </>
      )}
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
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [currentPage])

  const handleClickLabel = clickedLabel => {
    resetCurrentPage()
    setActiveLabels(prev => {
      const isAlreadyActive = prev.some(prevLabel => prevLabel.id === clickedLabel.id)
      return isAlreadyActive
        ? prev.filter(prevLabel => prevLabel.id !== clickedLabel.id) : [...prev, clickedLabel]
    })
  }

  const resetCurrentPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => prev - 1)
  const goToNextPage = () => setCurrentPage(prev => prev + 1)

  return (
    <div className="app">
      <IssuesList
        activeLabels={activeLabels}
        currentPage={currentPage}
        onClickLabel={handleClickLabel}
        onClickPreviousPage={goToPreviousPage}
        onClickNextPage={goToNextPage}
        onResetCurrentPage={resetCurrentPage}
      />
      <LabelsList activeLabels={activeLabels} onClickLabel={handleClickLabel} />
    </div>
  )
}

export { App }
