import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { gameStore } from './store/gameStore'

if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).gameStore = gameStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
