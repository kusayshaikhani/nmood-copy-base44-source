import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installKeyboardScroll } from '@/lib/keyboard-scroll'
import { installNativeRecoveryLinkHandler } from '@/lib/native-recovery-link'

installKeyboardScroll();

installNativeRecoveryLinkHandler()
  .catch((error) => console.error('[Native app link]', error))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  });