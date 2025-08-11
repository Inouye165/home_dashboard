import React from 'react';
import TempPanel from './TempPanel';
// import RealTempPanel from './RealTempPanel';
import WeatherPanel from './WeatherPanel';
import ChartPanelNew from './ChartPanelNew';
import { useESP8266Data } from '../hooks/useESP8266Data';

const Dashboard: React.FC = () => {
  const { data, loading, error } = useESP8266Data();

  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen"
      style={{
        // Use dynamic viewport height on mobile browsers
        minHeight: '100dvh'
      }}
    >
      {/* Safe-area top padding for notches/Dynamic Island */}
      <div
        className="md:pt-8"
        style={{
          // On mobile, push content down by the safe-area inset plus a little extra
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)'
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <header className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1 md:mb-2">
            🏠 Smart Home Dashboard
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Real-time monitoring and control for your ESP8266 devices
          </p>
        </header>

        {/* Status Bar */}
        <div className="mb-4 md:mb-6 flex justify-center">
          <div className="flex items-center space-x-4 bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  loading ? 'bg-yellow-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Connecting...' : error ? 'Connection Error' : 'Connected'}
              </span>
            </div>
            {data && (
              <div className="text-sm text-gray-500 ml-4">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="block md:hidden space-y-4">
          <div className="w-full">
            <ChartPanelNew data={data} loading={loading} />
          </div>
          <div className="w-full">
            <TempPanel data={data} loading={loading} />
          </div>
          <div className="w-full">
            <WeatherPanel />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="w-full">
            <TempPanel data={data} loading={loading} />
          </div>
          <div className="w-full">
            <WeatherPanel />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="h-72 lg:h-80">
              <ChartPanelNew data={data} loading={loading} />
            </div>
          </div>
        </div>

        <footer
          className="mt-12 mb-8 text-center text-gray-500 text-xs md:text-sm"
          style={{
            // Keep footer clear of the iOS home indicator on edge-to-edge
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <p>ESP8266 Smart Home Dashboard v2.1 - Built with React & TypeScript</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
