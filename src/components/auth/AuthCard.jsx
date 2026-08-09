import React from 'react';

// Shared white form card for all authentication screens.
// Uses the .auth-card CSS class to force light-theme token values inside the
// card, so labels, inputs, errors, and links always have accessible contrast
// against the white background — regardless of the app's dark/light theme.
export default function AuthCard({ children, className = '' }) {
  return (
    <div
      className={`auth-card w-full bg-white rounded-card shadow-elevated p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}