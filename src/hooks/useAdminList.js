import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Admin list loader. Reads go through the adminConsole backend function
 * (admin-verified, service-role) so admins see every record regardless of
 * per-entity row-level security.
 */
export function useAdminList(entityName, limit = 500) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('adminConsole', { mode: 'list', entity: entityName, limit });
      setData(res?.data || []);
    } catch (e) {
      setError(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [entityName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}