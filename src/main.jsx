import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRoot } from 'react-dom/client'
import { App } from '@/app'
import '@/index.css'

const rootElement = document.querySelector('[data-js="root"]')
const root = createRoot(rootElement)

const queryClient = new QueryClient()

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
