import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './estilo/app.css'

createRoot(document.getElementById('raiz')).render(<App />)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sem service worker a aplicação continua funcionando, só não abre offline.
    })
  })
}
