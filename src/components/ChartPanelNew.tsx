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
  outside?: number;    // °F (module 113)
  inside?: number;     // °F (module 115)
}

interface ChartPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

function toMillis(t: unknown): number {
  if (typeof t === 'number') return t < 1_000_000_000_000 ? t * 1000 : t; // sec→ms heuristic
  if (typeof t === 'string') {
    const n = Number(t);
    if (!Number.isNaN(n)) return n < 1_000_000_000_000 ? n * 1000 : n;
    const d = new Date(t).getTime();
    return Number.isNaN(d) ? NaN : d;
  }
  return NaN;
}

function getTempF(p: any): number | undefined {
  const fRaw = p.f ?? p.F ?? p.tempF ?? p.fahrenheit ?? p.temp ?? p.v;
  if (typeof fRaw === 'number') return fRaw;
  if (typeof fRaw === 'string') {
    const n = Number(fRaw);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function getModuleId(p: any): string {
  const raw = p.module ?? p.m ?? p.mod ?? '';
  const s = String(raw);
  const digits = s.match(/\d+/)?.[0];
  return digits ?? s; // prefer numeric id if present
}

const ChartPanelNew: React.FC<ChartPanelProps> = ({ data, loading }) => {
  const chartData: Point[] = useMemo(() => {
    console.log('Chart prepareChartData called:', data);

    // If series missing, show a single-point fallback from current temps
    let rawPoints: any[] | undefined = (data as any)?.series?.points;
    if (rawPoints && !Array.isArray(rawPoints) && typeof rawPoints === 'object') {
      rawPoints = Object.values(rawPoints);
    }

    if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
      console.log('No series data; using current temps fallback.');
      const now = Date.now();
      const outside = (data as any)?.module113?.temperature; // 113
      const inside  = (data as any)?.module115?.temperature; // 115
      const fallback: Point[] = [];
      if (typeof outside === 'number' || typeof inside === 'number') {
        fallback.push({
          time: now,
          outside: typeof outside === 'number' ? outside : undefined,
          inside:  typeof inside  === 'number' ? inside  : undefined,
        });
      }
      return fallback;
    }

    // Normalize points
    type NPoint = { t: number; module: string; f: number };
    const normalized: NPoint[] = rawPoints
      .map((p: any) => {
        const tMs = toMillis(
          p.u ?? p.ts ?? p.t ?? p.time ?? p.timestamp ?? p.date ?? p.datetime
        );
        const fNum = getTempF(p);
        const mod = getModuleId(p);
        return { t: tMs, module: String(mod), f: fNum as number };
      })
      .filter(p => Number.isFinite(p.t) && Number.isFinite(p.f) && p.module);

    if (normalized.length === 0) return [];

    // Time window: prefer last 7d, then 30d, else all (expanded for better coverage)
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const D7  = 7  * H24;
    const D30 = 30 * H24;
    const filterBySince = (since: number) => normalized.filter(p => p.t >= since);

    console.log('Time filtering debug:');
    console.log('  Total normalized points:', normalized.length);
    console.log('  Now timestamp:', now);
    console.log('  24h ago:', now - H24);
    console.log('  7d ago:', now - D7);
    console.log('  30d ago:', now - D30);
    
    let pool = filterBySince(now - D7);  // Start with 7 days instead of 24h
    console.log('  Points in last 7d:', pool.length);
    
    if (pool.length === 0) {
      pool = filterBySince(now - D30);  // Try 30 days
      console.log('  Points in last 30d:', pool.length);
    }
    if (pool.length === 0) {
      pool = normalized.slice();  // Use all data
      console.log('  Using all data points:', pool.length);
    }
    if (pool.length > 5000) {
      pool = pool.slice(-5000);  // Limit to last 5000 points
      console.log('  Limited to last 5000 points');
    }

    // Hard map: 113 → outside (red), 115 → inside (blue)
    const is113 = (m: string) => m === '113' || /(^|[^0-9])113([^0-9]|$)/.test(m);
    const is115 = (m: string) => m === '115' || /(^|[^0-9])115([^0-9]|$)/.test(m);

    const p113 = pool.filter(p => is113(p.module));
    const p115 = pool.filter(p => is115(p.module));

    console.log('Module filtering results:');
    console.log('  p113 points:', p113.length);
    console.log('  p115 points:', p115.length);
    console.log('  Sample p113 modules:', Array.from(new Set(p113.map(p => p.module))));
    console.log('  Sample p115 modules:', Array.from(new Set(p115.map(p => p.module))));
    console.log('  All unique modules in pool:', Array.from(new Set(pool.map(p => p.module))));

    // If firmware only tags series by an index, you can also map here:
    // e.g., treat module "1" as 113 and "2" as 115:
    const pIdx1 = pool.filter(p => p.module === '1');
    const pIdx2 = pool.filter(p => p.module === '2');
    const use113 = p113.length ? p113 : pIdx1.length ? pIdx1 : [];
    const use115 = p115.length ? p115 : pIdx2.length ? pIdx2 : [];

    // Build union of timestamps
    const tsSet = new Set<number>([
      ...use113.map(p => p.t),
      ...use115.map(p => p.t),
    ]);
    const ts = Array.from(tsSet).sort((a, b) => a - b);

    const m113ByT = new Map<number, number>(use113.map(p => [p.t, p.f]));
    const m115ByT = new Map<number, number>(use115.map(p => [p.t, p.f]));

    const out: Point[] = ts.map(t => ({
      time: t,
      outside: m113ByT.get(t),
      inside:  m115ByT.get(t),
    }));

    console.log(
      `Prepared ${out.length} points. 113(outside)=${use113.length}, 115(inside)=${use115.length}`
    );
    if (out.length) {
      console.log('First/Last:', out[0], out[out.length - 1]);
      console.log('Sample points with outside temp:', out.filter(p => p.outside !== undefined).slice(0, 3));
      console.log('Sample points with inside temp:', out.filter(p => p.inside !== undefined).slice(0, 3));
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
          Temperature History
        </h2>
        <div className="text-sm text-gray-500">Last 7 days</div>
      </div>

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
                  name === 'outside' ? 'Outside (113)' : 'Inside (115)',
                ]}
              />
              <Legend
                formatter={(value) => (value === 'outside' ? 'Outside (113)' : 'Inside (115)')}
              />
              <Line
                type="monotone"
                dataKey="outside"
                name="Outside (113)"
                stroke="rgb(255, 99, 132)"   // red
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="inside"
                name="Inside (115)"
                stroke="rgb(54, 162, 235)"   // blue
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
