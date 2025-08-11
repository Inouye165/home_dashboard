import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ESP8266Data } from '../hooks/useESP8266Data';

interface Point {
  time: number;        // epoch ms
  outside?: number;    // °F
  inside?: number;     // °F
}

interface ChartPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

function toMillis(t: unknown): number {
  if (typeof t === 'number') {
    // Heuristic: treat values < 10^12 as seconds
    return t < 1_000_000_000_000 ? t * 1000 : t;
  }
  if (typeof t === 'string') {
    const n = Number(t);
    if (!Number.isNaN(n)) {
      return n < 1_000_000_000_000 ? n * 1000 : n;
    }
    const d = new Date(t).getTime();
    return Number.isNaN(d) ? Date.now() : d;
  }
  return Date.now();
}

const ChartPanelNew: React.FC<ChartPanelProps> = ({ data, loading }) => {
  const chartData: Point[] = useMemo(() => {
    console.log('Chart prepareChartData called with data:', data);

    const rawPoints = (data as any)?.series?.points;
    if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
      console.log('No series data; building fallback from current temps.');
      const now = Date.now();
      const outside = (data as any)?.module113?.temperature;
      const inside = (data as any)?.module115?.temperature;

      const fallback: Point[] = [];
      if (typeof outside === 'number' || typeof inside === 'number') {
        fallback.push({
          time: now,
          outside: typeof outside === 'number' ? outside : undefined,
          inside: typeof inside === 'number' ? inside : undefined,
        });
      }
      return fallback;
    }

    // Normalize incoming points
    type NPoint = { t: number; module: string; f: number };
    const normalized: NPoint[] = rawPoints
      .map((p: any) => {
        const tMs =
          p.u !== undefined ? toMillis(p.u) :
          p.t !== undefined ? toMillis(p.t) :
          p.time !== undefined ? toMillis(p.time) :
          NaN;

        // Try several likely Fahrenheit keys
        const fRaw = p.f ?? p.tempF ?? p.fahrenheit ?? p.v ?? undefined;
        const fNum = typeof fRaw === 'string' ? Number(fRaw) : fRaw;

        const mod = String(p.module ?? p.m ?? '');

        return { t: tMs, module: mod, f: fNum };
      })
      .filter(p => Number.isFinite(p.t) && Number.isFinite(p.f) && p.module);

    if (normalized.length === 0) {
      console.log('All normalized points filtered out.');
      return [];
    }

    const now = Date.now();
    const since = now - 24 * 60 * 60 * 1000;

    // Filter to last 24h
    const last24h = normalized.filter(p => p.t >= since);

    // Partition
    const mod113 = last24h.filter(p => p.module === '113');
    const mod115 = last24h.filter(p => p.module === '115');

    console.log('Module type sample:', typeof rawPoints[0]?.module, rawPoints[0]?.module);
    console.log('u sample:', rawPoints[0]?.u, '→ ms:', normalized[0]?.t);
    console.log('Counts 24h: mod113=', mod113.length, 'mod115=', mod115.length);

    // Build timestamp union
    const tsSet = new Set<number>();
    for (const p of mod113) tsSet.add(p.t);
    for (const p of mod115) tsSet.add(p.t);
    const timestamps = Array.from(tsSet).sort((a, b) => a - b);

    // Make O(1) lookup maps by timestamp
    const m113ByT = new Map<number, number>();
    const m115ByT = new Map<number, number>();
    for (const p of mod113) m113ByT.set(p.t, p.f);
    for (const p of mod115) m115ByT.set(p.t, p.f);

    const out: Point[] = timestamps.map(t => ({
      time: t,
      outside: m113ByT.get(t),
      inside: m115ByT.get(t),
    }));

    console.log('Chart data prepared:', out.length, 'points');
    if (out.length) {
      console.log('First:', out[0], 'Last:', out[out.length - 1]);
    }

    return out;
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  const hasData = chartData.length > 0;
  console.log('ChartPanelNew render - hasData:', hasData, 'len:', chartData.length);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
          Temperature History
        </h2>
        <div className="text-sm text-gray-500">Last 24 hours</div>
      </div>

      {/* Parent should set a height (e.g., h-80). */}
      <div className="w-full h-64 md:h-72 lg:h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(t) =>
                  new Date(t as number).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              />
              <YAxis unit="°F" />
              <Tooltip
                labelFormatter={(t) => new Date(t as number).toLocaleString()}
                formatter={(val: any, name) => [
                  typeof val === 'number' ? val.toFixed(1) : val,
                  name === 'outside' ? 'Outside (°F)' : 'Inside (°F)',
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="outside"
                name="Outside (°F)"
                stroke="rgb(255, 99, 132)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="inside"
                name="Inside (°F)"
                stroke="rgb(54, 162, 235)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No history yet. Waiting for readings…
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPanelNew;
