import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CurrencyProvider } from './context/CurrencyContext.tsx'
import { ProProvider } from './context/ProContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <ProProvider>
        <App />
      </ProProvider>
    </CurrencyProvider>
  </StrictMode>,
)
