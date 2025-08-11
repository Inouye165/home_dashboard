import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import TempPanel from './TempPanel';
import WeatherPanel from './WeatherPanel';
import ChartPanelNew from './ChartPanelNew';
import { useESP8266Data } from '../hooks/useESP8266Data';

/* ========= AutoFit: scale whole app to viewport (no scroll) ========= */
const AutoFit: React.FC<{ children: React.ReactNode; buffer?: number }> = ({ children, buffer = 8 }) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = contentRef.current?.offsetWidth ?? vw;
    const h = contentRef.current?.offsetHeight ?? vh;
    const s = Math.min((vw - buffer) / w, (vh - buffer) / h);
    setScale(s);
  };

  useLayoutEffect(() => {
    const ro = new ResizeObserver(updateScale);
    if (contentRef.current) ro.observe(contentRef.current);

    window.addEventListener('resize', updateScale);
    updateScale(); // initial call

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [buffer]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      <div
        ref={shellRef}
        className="w-full h-full flex items-start justify-center"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <div ref={contentRef} className="p-3">
          {children}
        </div>
      </div>
    </div>
  );
};
/* ==================================================================== */

const Dashboard: React.FC = () => {
  const { data, loading, error } = useESP8266Data();

  return (
    <AutoFit buffer={12}>
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        {/* Top row: two columns that share the same track height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left: Temperature Sensors — this dictates the row height */}
          <div className="h-full min-h-0">
            <TempPanel data={data} loading={loading} />
          </div>

          {/* Right: header 25% / weather 75% of the SAME height as the left */}
          <div className="grid gap-4 h-full min-h-0" style={{ gridTemplateRows: '1fr 3fr' }}>
            {/* Header (25%) */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-4 flex items-center justify-center min-h-0">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">🏠 Smart Home Dashboard</h1>
                <p className="text-sm text-gray-600 mb-3">Real-time monitoring and control</p>
                <div className="flex items-center justify-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        loading ? 'bg-yellow-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {loading ? 'Connecting...' : error ? 'Connection Error' : 'Connected'}
                    </span>
                  </div>
                  {data && <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>}
                </div>
              </div>
            </div>

            {/* Weather (75%) */}
            <div className="h-full min-h-0">
              <WeatherPanel />
            </div>
          </div>
        </div>

        {/* Chart row: fixed visual band, always fully visible */}
        <div className="mt-4">
          {/* Adjust this height if you want a bigger/smaller chart; AutoFit will rescale */}
          <div className="w-full rounded-3xl overflow-hidden h-[300px]">
            {/* Ensure ChartPanelNew uses <ResponsiveContainer width="100%" height="100%"> */}
            <ChartPanelNew data={data} loading={loading} />
          </div>
        </div>

        {/* Small footer buffer */}
        <footer className="mt-2 text-center text-gray-500 text-xs leading-[32px] h-[32px]">
          ESP8266 Smart Home Dashboard v2.0 — Built with React & TypeScript
        </footer>
      </div>
    </AutoFit>
  );
};

export default Dashboard;
