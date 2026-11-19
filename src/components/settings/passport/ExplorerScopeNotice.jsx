import React from 'react';
import { Link } from 'react-router-dom';
import { MAIN_PASSPORT, usePassportScope } from '@/lib/passport/runtime';
export default function ExplorerScopeNotice() {
  const { data, isPending, isError, refetch } = usePassportScope();
  if (!MAIN_PASSPORT) return null;
  if (isPending) return <p role="status" className="px-4 py-2">Loading your Explorer country…</p>;
  if (isError) return <p role="alert" className="px-4 py-2">Your Explorer country could not be loaded. <button onClick={() => refetch()}>Try again</button></p>;
  if (!data?.country) return <p role="status" className="px-4 py-2">Set your home country in <Link to="/profile">your profile</Link> to start exploring.</p>;
  // Scope remains enforced by the server; successful scope is not a public UI label.
  return null;
}
