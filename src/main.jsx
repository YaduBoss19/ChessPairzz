import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LiveBroadcastView from './components/LiveBroadcastView.jsx'

const isLiveView = window.location.pathname.startsWith('/live') || window.location.search.includes('?live');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLiveView ? <LiveBroadcastView /> : <App />}
  </StrictMode>,
)
