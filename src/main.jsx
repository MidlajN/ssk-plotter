import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CanvasProvider, CommunicationProvider } from './context.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CanvasProvider>
      <CommunicationProvider>
        <App />
      </CommunicationProvider>
    </CanvasProvider>
  </React.StrictMode>,
)
