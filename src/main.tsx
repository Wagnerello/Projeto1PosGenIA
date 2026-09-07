/* eslint-disable @typescript-eslint/no-non-null-assertion */ // FIXME: D�vida t�cnica (Quarentena)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
