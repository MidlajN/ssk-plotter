import React from 'react'
import ReactDOM from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { CanvasProvider } from './context/CanvasContext.jsx';
import { CommunicationProvider } from './context/ComContext.jsx'
import { PlotSvg } from './components/Icons.jsx';
import App from './App.jsx'
import './main.css'

const setFavicon = () => {
  const svgString = renderToString(<PlotSvg />)
  const blob = new Blob([svgString], { type: 'image/svg+xml'})
  const dataUrl = URL.createObjectURL(blob);
  const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = dataUrl;
  document.head.appendChild(favicon);

  return () => URL.revokeObjectURL(blob)
}
setFavicon();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CanvasProvider>
      <CommunicationProvider>
        <App />
      </CommunicationProvider>
    </CanvasProvider>
  </React.StrictMode>,
)