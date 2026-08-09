/**
 * FM-009 — Communication Center: admin action wrappers.
 * Every call routes through the adminConsole backend function, which verifies
 * the caller's admin role server-side and audit-logs each mutation.
 */
import { base44 } from '@/api/base44Client';

const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};
const result = (r) => r?.data?.result;

export const listCampaigns = () =>
  base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Campaign' }).then(extract);

export const listTemplates = () =>
  base44.functions.invoke('adminConsole', { mode: 'list', entity: 'CampaignTemplate' }).then(extract);

export const createCampaign = (record) =>
  base44.functions.invoke('adminConsole', { mode: 'create', entity: 'Campaign', record }).then(result);

export const updateCampaign = (id, patch) =>
  base44.functions.invoke('adminConsole', { mode: 'update', entity: 'Campaign', id, patch }).then(result);

export const createTemplate = (record) =>
  base44.functions.invoke('adminConsole', { mode: 'create', entity: 'CampaignTemplate', record }).then(result);

export const updateTemplate = (id, patch) =>
  base44.functions.invoke('adminConsole', { mode: 'update', entity: 'CampaignTemplate', id, patch }).then(result);

export const deleteCommunication = (entity, id) =>
  base44.functions.invoke('adminConsole', { mode: 'deleteCommunication', entity, id });

export const estimateAudience = (filters) =>
  base44.functions.invoke('adminConsole', { mode: 'estimateAudience', filters }).then((r) => r?.data?.count ?? 0);

export const sendCampaign = (id) =>
  base44.functions.invoke('adminConsole', { mode: 'sendCampaign', id }).then((r) => r?.data);

export const duplicateCampaign = (id) =>
  base44.functions.invoke('adminConsole', { mode: 'duplicateCampaign', id }).then(result);