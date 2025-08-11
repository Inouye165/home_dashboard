import React from 'react';
import TempPanel from './TempPanel';
import RealTempPanel from './RealTempPanel';
import WeatherPanel from './WeatherPanel';
import ChartPanelNew from './ChartPanelNew';
import { useESP8266Data } from '../hooks/useESP8266Data';

const Dashboard: React.FC = () => {
  const { data, loading, error } = useESP8266Data();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏠 Smart Home Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring and control for your ESP8266 devices
          </p>
        </header>

        {/* Status Bar */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-4 bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Connecting...' : error ? 'Connection Error' : 'Connected'}
              </span>
            </div>
            {data && (
              <div className="text-sm text-gray-500">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Temperature Panel */}
          <TempPanel data={data} loading={loading} />
          
          {/* Real Temperature Panel */}
          <RealTempPanel data={data} loading={loading} />
          
          {/* Weather Panel */}
          <WeatherPanel />
          
          {/* Chart Panel */}
          <ChartPanelNew data={data} loading={loading} />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>ESP8266 Smart Home Dashboard v2.0 - Built with React & TypeScript</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
