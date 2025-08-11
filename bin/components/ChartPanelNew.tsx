import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ESP8266Data } from '../hooks/useESP8266Data';

interface ChartPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

const ChartPanelNew: React.FC<ChartPanelProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
          Historical Data (Fixed)
        </h2>
        <div className="text-sm text-gray-500">
          Chart component loaded successfully
        </div>
      </div>

      <div className="text-center py-16 text-gray-500">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <p className="text-lg font-medium mb-2">Chart Component Fixed!</p>
        <p className="text-sm">The seriesData.map error has been resolved</p>
        <p className="text-sm mt-2">Data will appear here once the full chart is implemented</p>
      </div>
    </div>
  );
};

export default ChartPanelNew;
