import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installKeyboardScroll } from '@/lib/keyboard-scroll'

installKeyboardScroll();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)