import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminApp from './AdminApp'
import './styles.css'

const Root = ['/admin', '/owner'].some((path) => window.location.pathname === path || window.location.pathname.startsWith(`${path}/`)) ? AdminApp : App

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>,
)
