import React from 'react';
import { ExternalLink, Smartphone, X } from 'lucide-react';

const IOS_STORE_SEARCH = 'https://apps.apple.com/us/search?term=Nmood';
const ANDROID_STORE_SEARCH = 'https://play.google.com/store/search?q=Nmood&c=apps';

function storeUrl() {
  const ua = navigator.userAgent || '';
  const configured = /Android/i.test(ua)
    ? import.meta.env.VITE_NMOOD_ANDROID_STORE_URL
    : import.meta.env.VITE_NMOOD_IOS_STORE_URL;
  return configured || (/Android/i.test(ua) ? ANDROID_STORE_SEARCH : IOS_STORE_SEARCH);
}

export default function WebPurchasePrompt({ open, onOpenChange }) {
  if (!open) return null;

  const openAppOrStore = () => {
    const fallback = storeUrl();
    const timer = window.setTimeout(() => {
      window.location.assign(fallback);
    }, 1200);
    window.location.assign('nmood://membership');
    window.addEventListener('pagehide', () => window.clearTimeout(timer), { once: true });
  };

  const openStore = () => window.location.assign(storeUrl());

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="web-purchase-title">
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></div>
          <button type="button" className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close" onClick={() => onOpenChange(false)}><X className="h-5 w-5" /></button>
        </div>
        <h2 id="web-purchase-title" className="mt-4 font-heading text-xl font-bold">Continue in the Nmood app</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Premium subscriptions are purchased securely through the Nmood mobile app. Open the app to continue, or download it from your app store.</p>
        <button type="button" onClick={openAppOrStore} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-button bg-nmood-gradient font-semibold text-primary-foreground"><Smartphone className="h-4 w-4" />Open Nmood app</button>
        <button type="button" onClick={openStore} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-button border border-border font-medium"><ExternalLink className="h-4 w-4" />Download Nmood</button>
      </div>
    </div>
  );
}

