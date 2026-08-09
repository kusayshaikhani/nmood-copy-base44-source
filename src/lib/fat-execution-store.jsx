import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { FAT_SUITES, ALL_SCENARIOS } from '@/lib/fat-suites';

// EX-001 — Founder Acceptance Execution state (operational tracking only).
// Persists to localStorage; no product entities introduced.

const STORAGE_KEY = 'nmood:fat-execution-v2';

export const TEST_STATUSES = ['notTested', 'pass', 'passWithNotes', 'fail', 'blocked', 'approved', 'rejected'];

export const STATUS_META = {
  notTested: { label: 'Not Tested', color: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground' },
  pass: { label: 'Pass', color: 'text-success', chip: 'bg-success/10 text-success' },
  passWithNotes: { label: 'Pass w/ Notes', color: 'text-success', chip: 'bg-success/10 text-success' },
  fail: { label: 'Fail', color: 'text-destructive', chip: 'bg-destructive/10 text-destructive' },
  blocked: { label: 'Blocked', color: 'text-warning', chip: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', color: 'text-success', chip: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', color: 'text-destructive', chip: 'bg-destructive/10 text-destructive' },
};

export const DEFECT_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Release 1.1'];
export const DEFECT_STATUSES = ['Open', 'In Progress', 'Fixed', 'Retest Failed', 'Closed', "Won't Fix"];
export const RETEST_STATUSES = ['Pending', 'Passed', 'Failed'];

export const CERT_APPROVALS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
export const CERT_STATUSES = ['Not Certified', 'In Review', 'Certified', 'Rejected'];

function defaultScenario() {
  return { status: 'notTested', runCount: 0, lastRunAt: null, evidence: { notes: '', logs: '', attachments: [] } };
}
function defaultCert() {
  return { approval: 'pending', date: '', comments: '', status: 'Not Certified' };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { results: {}, defects: [], certifications: {} };
}

const FatContext = createContext(null);

export function FatExecutionProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state]);

  const patchScenario = useCallback((id, patch) =>
    setState((s) => ({
      ...s,
      results: { ...s.results, [id]: { ...defaultScenario(), ...(s.results[id] || {}), ...patch } },
    })), []);

  const runTest = useCallback((id) =>
    setState((s) => {
      const cur = s.results[id] || defaultScenario();
      return {
        ...s,
        results: { ...s.results, [id]: { ...cur, runCount: (cur.runCount || 0) + 1, lastRunAt: new Date().toISOString() } },
      };
    }), []);

  const setStatus = useCallback((id, status) => patchScenario(id, { status }), [patchScenario]);

  const retest = useCallback((id) =>
    setState((s) => {
      const cur = s.results[id] || defaultScenario();
      return {
        ...s,
        results: { ...s.results, [id]: { ...cur, status: 'notTested', runCount: (cur.runCount || 0) + 1, lastRunAt: new Date().toISOString() } },
      };
    }), []);

  const setEvidence = useCallback((id, patch) =>
    setState((s) => {
      const cur = s.results[id] || defaultScenario();
      const ev = cur.evidence || { notes: '', logs: '', attachments: [] };
      return { ...s, results: { ...s.results, [id]: { ...cur, evidence: { ...ev, ...patch } } } };
    }), []);

  const addDefect = useCallback((defect) =>
    setState((s) => ({
      ...s,
      defects: [...s.defects, { id: `DFC-${Date.now()}`, status: 'Open', retestStatus: 'Pending', ...defect }],
    })), []);
  const updateDefect = useCallback((id, patch) =>
    setState((s) => ({ ...s, defects: s.defects.map((d) => (d.id === id ? { ...d, ...patch } : d)) })), []);
  const removeDefect = useCallback((id) =>
    setState((s) => ({ ...s, defects: s.defects.filter((d) => d.id !== id) })), []);

  const setCertification = useCallback((suiteId, patch) =>
    setState((s) => ({
      ...s,
      certifications: { ...s.certifications, [suiteId]: { ...defaultCert(), ...(s.certifications[suiteId] || {}), ...patch } },
    })), []);

  const summary = useMemo(() => {
    const total = ALL_SCENARIOS.length;
    let pass = 0, passWithNotes = 0, fail = 0, blocked = 0, notTested = 0, approved = 0, rejected = 0;
    for (const sc of ALL_SCENARIOS) {
      const st = state.results[sc.id]?.status || 'notTested';
      if (st === 'pass') pass++;
      else if (st === 'passWithNotes') passWithNotes++;
      else if (st === 'fail') fail++;
      else if (st === 'blocked') blocked++;
      else if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
      else notTested++;
    }
    const passedTotal = pass + passWithNotes + approved;
    const suitesTotal = FAT_SUITES.length;
    const suitesCompleted = FAT_SUITES.filter((suite) => {
      const allTested = suite.scenarios.every((sc) => (state.results[sc.id]?.status || 'notTested') !== 'notTested');
      const cert = state.certifications[suite.id]?.approval;
      return allTested && (cert === 'approved' || cert === 'rejected');
    }).length;
    const suitesRemaining = suitesTotal - suitesCompleted;
    const mandatory = FAT_SUITES.filter((s) => s.signOffRequired);
    const mandatoryCertified = mandatory.filter((s) => state.certifications[s.id]?.approval === 'approved').length;
    const critDefects = state.defects.filter((d) => d.severity === 'Critical' && d.status !== 'Closed').length;
    const highDefects = state.defects.filter((d) => d.severity === 'High' && d.status !== 'Closed').length;
    const openDefects = state.defects.filter((d) => d.status !== 'Closed').length;
    const overallProgress = total ? Math.round((passedTotal / total) * 100) : 0;
    const certificationStatus =
      fail === 0 && blocked === 0 && critDefects === 0 && mandatoryCertified === mandatory.length
        ? 'Certified'
        : mandatoryCertified > 0 || passedTotal > 0
        ? 'In Progress'
        : 'Not Started';
    return {
      total, pass, passWithNotes, fail, blocked, notTested, approved, rejected, passedTotal,
      suitesTotal, suitesCompleted, suitesRemaining, mandatory: mandatory.length, mandatoryCertified,
      critDefects, highDefects, openDefects, overallProgress, certificationStatus,
    };
  }, [state]);

  const value = {
    state, summary,
    patchScenario, runTest, setStatus, retest, setEvidence,
    addDefect, updateDefect, removeDefect, setCertification,
  };

  return <FatContext.Provider value={value}>{children}</FatContext.Provider>;
}

export function useFatExecution() {
  const ctx = useContext(FatContext);
  if (!ctx) throw new Error('useFatExecution must be used within FatExecutionProvider');
  return ctx;
}