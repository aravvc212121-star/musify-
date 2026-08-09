/**
 * RHYM — Entry Point
 * Simplified: no Clerk, direct render
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlayerProvider>
        <App />
        <Toaster
          position="bottom-center"
          containerStyle={{ bottom: 100 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              border: 'none',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 16px',
              maxWidth: '300px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              textAlign: 'center'
            },
            success: {
              iconTheme: { primary: '#fff', secondary: '#000' },
            },
          }}
        />
      </PlayerProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
