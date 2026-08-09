import React, { createContext, useContext, useMemo, useState } from 'react';

const SettingsSearchContext = createContext({ searchTerm: '', setSearchTerm: () => {} });

export function SettingsSearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const value = useMemo(() => ({ searchTerm, setSearchTerm }), [searchTerm]);
  return (
    <SettingsSearchContext.Provider value={value}>
      {children}
    </SettingsSearchContext.Provider>
  );
}

export function useSettingsSearch() {
  return useContext(SettingsSearchContext);
}