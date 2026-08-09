import { useEffect, useState, useCallback } from 'react';
import { listCampaigns, listTemplates } from '@/lib/communication-actions';

/** FM-009 — Loads Campaign + CampaignTemplate for the Communication Center. */
export function useCommunicationData() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, t] = await Promise.all([listCampaigns(), listTemplates()]);
      setCampaigns(c); setTemplates(t);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { campaigns, templates, loading, error, refresh };
}