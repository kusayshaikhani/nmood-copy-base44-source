import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ErrorState from '@/components/shared/ErrorState';
import ProductKpiGrid from '@/components/admin/product/ProductKpiGrid';
import ProductRetentionCard from '@/components/admin/product/ProductRetentionCard';
import ProductEventBreakdown from '@/components/admin/product/ProductEventBreakdown';
import ProductTopCategories from '@/components/admin/product/ProductTopCategories';
import ProductPopularInterests from '@/components/admin/product/ProductPopularInterests';
import ProductDashboardSkeleton from '@/components/admin/product/ProductDashboardSkeleton';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminProduct() {
  const { t } = useLocalization();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('productAnalytics', {});
      setData(res.data);
    } catch (e) {
      setError(e?.message || 'Failed to load product analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('admin.product_analytics')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.anonymous_product_intelligence_for_improvement')}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-default disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl border border-success/30 bg-success/5">
        <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          {data?.privacy || 'Aggregate only — private messages, conversations, and member identities are never exposed.'}
        </p>
      </div>

      {loading ? (
        <ProductDashboardSkeleton />
      ) : error ? (
        <ErrorState kind="server" onRetry={load} />
      ) : data ? (
        <>
          <ProductKpiGrid totals={data.totals} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductRetentionCard retention={data.retention} />
            <ProductEventBreakdown eventCounts={data.eventCounts} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductTopCategories items={data.topCategories} />
            <ProductPopularInterests items={data.popularInterests} />
          </div>
        </>
      ) : null}
    </div>
  );
}