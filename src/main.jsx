import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRoot } from 'react-dom/client'
import { App } from '@/app'
import { IssueDetails } from '@/issue-details'
import { issueDetailsLoader } from '@/issue-details-loader'
import '@/index.css'

const rootElement = document.querySelector('[data-js="root"]')
const root = createRoot(rootElement)

const queryClient = new QueryClient()

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<App />} />
      <Route path="issues/:issueNumber" element={<IssueDetails />} loader={issueDetailsLoader} />
    </Route>
  )
)

root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
