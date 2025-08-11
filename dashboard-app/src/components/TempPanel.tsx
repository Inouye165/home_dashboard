import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { ESP8266Data } from '../hooks/useESP8266Data';

interface TempPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

const TempPanel: React.FC<TempPanelProps> = ({ data, loading }) => {
  const moduleData = data?.module113;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Thermometer className="w-5 h-5 mr-2 text-red-500" />
          Temperature Sensor
        </h2>
        <div className="text-sm text-gray-500">
          Module 113
        </div>
      </div>

      {moduleData ? (
        <div className="space-y-4">
          {/* Temperature */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
            <div className="flex items-center">
              <Thermometer className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Temperature</div>
                <div className="text-2xl font-bold text-gray-800">
                  {moduleData.temperature?.toFixed(1)}°C
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {moduleData.timestamp ? new Date(moduleData.timestamp).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
            <div className="flex items-center">
              <Droplets className="w-6 h-6 text-blue-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Humidity</div>
                <div className="text-2xl font-bold text-gray-800">
                  {moduleData.humidity?.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Pressure */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center">
              <Gauge className="w-6 h-6 text-purple-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Pressure</div>
                <div className="text-2xl font-bold text-gray-800">
                  {moduleData.pressure?.toFixed(1)} hPa
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Thermometer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No data available</p>
        </div>
      )}
    </div>
  );
};

export default TempPanel;
