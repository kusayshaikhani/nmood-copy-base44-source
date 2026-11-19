import { Capacitor } from '@capacitor/core'
import { installAndroidPresentation } from '@/lib/android-presentation'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import BootstrapErrorBoundary from '@/components/shared/BootstrapErrorBoundary'

installAndroidPresentation(document, Capacitor.getPlatform());
const recovery = window.NmoodRecovery;
let bootstrapPath = 'MODULE';
function MountedApp({ App }) {
  useEffect(() => { recovery?.ready(); }, []);
  return <App />;
}

async function bootstrap() {
  recovery?.begin('module');
  const [{ default: App }, { installKeyboardScroll }, { installNativeRecoveryLinkHandler }] = await Promise.all([
    import('@/App.jsx'), import('@/lib/keyboard-scroll'), import('@/lib/native-recovery-link'),
  ]);
  bootstrapPath = 'NATIVE';
  installKeyboardScroll();
  recovery?.begin('native-link');
  await installNativeRecoveryLinkHandler();
  bootstrapPath = 'ROOT';
  recovery?.begin('render');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <BootstrapErrorBoundary path="ROOT"><MountedApp App={App} /></BootstrapErrorBoundary>
  );
}
bootstrap().catch(error => recovery?.failure(error, bootstrapPath, bootstrapPath === 'MODULE' ? 'module' : 'unexpected'));
