import { useState, useEffect, useRef } from 'react';

console.log('__BUILD_TAG__ useESP8266Data v4', new Date().toISOString());

export interface ESP8266Data {
  module113?: { temperature?: number; humidity?: number; pressure?: number; timestamp?: string };
  module115?: { temperature?: number; humidity?: number; pressure?: number; timestamp?: string };
  series?: {
    rev: string;
    module: string;
    period_ms: number;
    points: Array<{ u: number; f: number; module: string }>;
  };
}

export const useESP8266Data = () => {
  const [data, setData] = useState<ESP8266Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const didInit = useRef(false); // guard Strict Mode double mount

  // ---- helpers ----
  const fetchTextOnce = async (url: string) => {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const txt  = await resp.text(); // READ EXACTLY ONCE
      return { ok: resp.ok, status: resp.status, text: txt };
    } catch (e) {
      return { ok: false, status: 0, text: null as string | null };
    }
  };

  const sanitizeSeriesText = (s: string) => {
    let t = s.replace(/^\uFEFF/, '').trim(); // strip BOM
    t = t.replace(/,(?=\s*,)/g, '');         // collapse ",,,"
    t = t.replace(/,\s*(?=[\]\}])/g, '');    // remove trailing commas before ] or }
    return t;
  };

  const parseJson = <T,>(txt: string | null, sanitize = false): T | null => {
    if (!txt) return null;
    const src = sanitize ? sanitizeSeriesText(txt) : txt;
    try {
      return JSON.parse(src) as T;
    } catch (e) {
      console.error('JSON parse failed:', e, 'source snippet:', src.slice(0, 300));
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setError(null);

      // Read all endpoints ONCE as text with cache busting
      const q = `?t=${Date.now()}`;
      const [m113, m115, s113, s115] = await Promise.all([
        fetchTextOnce('/api/esp8266/113/json' + q),
        fetchTextOnce('/api/esp8266/115/json' + q),
        fetchTextOnce('/api/esp8266/113/series' + q),
        fetchTextOnce('/api/esp8266/115/series' + q),
      ]);

      const out: ESP8266Data = {};
      const combined: Array<{ u: number; f: number; module: string }> = [];

      // Current 113
      if (m113.ok && m113.text) {
        const j = parseJson<any>(m113.text);
        if (j) {
          out.module113 = {
            temperature: j?.tempF ?? j?.temperature ?? j?.f,
            humidity: j?.humidity,
            pressure: j?.pressure,
            timestamp: j?.time_str
              ? new Date(String(j.time_str).replace(' ', 'T') + 'Z').toISOString()
              : j?.timestamp,
          };
        }
      }

      // Current 115
      if (m115.ok && m115.text) {
        const j = parseJson<any>(m115.text);
        if (j) {
          out.module115 = {
            temperature: j?.tempF ?? j?.temperature ?? j?.f,
            humidity: j?.humidity,
            pressure: j?.pressure,
            timestamp: j?.time_str
              ? new Date(String(j.time_str).replace(' ', 'T') + 'Z').toISOString()
              : j?.timestamp,
          };
        }
      }

      // Series 113 (malformed → sanitize)
      if (s113.ok && s113.text) {
        const j = parseJson<any>(s113.text, true);
        const pts = j?.points;
        if (Array.isArray(pts)) {
          for (const p of pts) {
            const u = typeof p.u === 'number' ? p.u : Number(p.u);
            const f = typeof p.f === 'number' ? p.f : Number(p.f);
            if (Number.isFinite(u) && Number.isFinite(f)) combined.push({ u, f, module: '113' });
          }
        } else {
          console.warn('113 /series unexpected structure:', j);
        }
      } else if (!s113.ok) {
        console.warn('113 /series request failed:', s113.status);
      }

      // Series 115 (valid JSON)
      if (s115.ok && s115.text) {
        const j = parseJson<any>(s115.text);
        const pts = j?.points;
        if (Array.isArray(pts)) {
          for (const p of pts) {
            const u = typeof p.u === 'number' ? p.u : Number(p.u);
            const f = typeof p.f === 'number' ? p.f : Number(p.f);
            if (Number.isFinite(u) && Number.isFinite(f)) combined.push({ u, f, module: '115' });
          }
        } else {
          console.warn('115 /series unexpected structure:', j);
        }
      } else if (!s115.ok) {
        console.warn('115 /series request failed:', s115.status);
      }

      setData({
        module113: out.module113,
        module115: out.module115,
        series: { rev: 'combined', module: 'combined', period_ms: 120000, points: combined },
      });
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didInit.current) return; // avoid double interval in dev Strict Mode
    didInit.current = true;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchData };
};
