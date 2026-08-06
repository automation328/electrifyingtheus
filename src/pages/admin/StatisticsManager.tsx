// CMS Statistics — the /admin analytics dashboard, embedded inside the content
// editor. Authorized by the editor session (op:"analytics"), so no separate
// analytics password and no leaving the CMS. Visuals shared via AnalyticsView.

import { useCallback, useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import AnalyticsView from "@/components/admin/AnalyticsView";
import { fetchAdminAnalytics, fetchAdminJourney, type AnalyticsData } from "@/lib/admin-api";

const StatisticsManager = () => {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (r: string) => {
    setLoading(true); setError("");
    try {
      setData(await fetchAdminAnalytics(r));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load statistics right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-1 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Statistics
        </h1>
        <p className="text-sm text-muted-foreground">First-party traffic, visitors, and conversions for electrifyingtheus.com.</p>
      </div>
      <AnalyticsView
        data={data}
        loading={loading}
        error={error}
        range={range}
        onRange={setRange}
        onRefresh={() => load(range)}
        fetchJourney={(visitorId) => fetchAdminJourney(visitorId).catch(() => null)}
      />
    </div>
  );
};

export default StatisticsManager;
