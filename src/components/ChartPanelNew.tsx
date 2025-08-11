import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ESP8266Data } from '../hooks/useESP8266Data';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

interface ChartPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ChartPanelNew: React.FC<ChartPanelProps> = ({ data, loading }) => {

    // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        }
      },
      title: {
        display: window.innerWidth >= 640,
        text: 'Temperature History',
        font: {
          size: window.innerWidth < 640 ? 14 : 16
        }
      },
    },
    scales: {
              x: {
          type: 'time' as const,
          time: {
            unit: 'hour' as const,
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd'
            }
          },
          title: {
            display: window.innerWidth >= 640,
            text: 'Time',
            font: {
              size: window.innerWidth < 640 ? 10 : 12
            }
          },
          ticks: {
            font: {
              size: window.innerWidth < 640 ? 8 : 10
            }
          }
        },
      y: {
        title: {
          display: window.innerWidth >= 640,
          text: 'Temperature (°F)',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 8 : 10
          }
        }
      }
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!data?.series?.points) {
      return {
        labels: [],
        datasets: []
      };
    }

    const points = data.series.points;
    console.log('Chart points:', points);
    console.log('First point sample:', points[0]);
    console.log('Last point sample:', points[points.length - 1]);
    console.log('Sample timestamps from first 5 points:');
    points.slice(0, 5).forEach((point: any, index: number) => {
      console.log(`Point ${index}: u=${point.u}, f=${point.f}, module=${point.module}`);
    });

    // Sort points by timestamp
    const sortedPoints = points.sort((a: any, b: any) => {
      const timeA = a.u || a.unix_ms || a.timestamp;
      const timeB = b.u || b.unix_ms || b.timestamp;
      return timeA - timeB;
    });

    // Get the last 24 hours of data
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    console.log('Filtering data from:', new Date(twentyFourHoursAgo).toISOString(), 'to:', new Date(now).toISOString());
    
    const recentPoints = sortedPoints.filter((point: any) => {
      const timestamp = point.u || point.unix_ms || point.timestamp;
      if (typeof timestamp === 'number') {
        // If timestamp is in seconds, convert to milliseconds
        const timestampMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
        const isRecent = timestampMs >= twentyFourHoursAgo;
        if (!isRecent) {
          console.log('Filtering out old point:', new Date(timestampMs).toISOString(), 'temp:', point.f);
        }
        return isRecent;
      }
      return true; // Keep points with invalid timestamps for now
    });
    
    console.log('Total points after 24h filter:', recentPoints.length);

    // Separate data by module
    const module113Points = recentPoints.filter((point: any) => !point.module || point.module === '1');
    const module115Points = recentPoints.filter((point: any) => point.module === '2');

    console.log('Module 113 points:', module113Points.length);
    console.log('Module 115 points:', module115Points.length);

        // Create separate datasets for each module to ensure proper line connections
    const outsideData = recentPoints
      .filter((point: any) => !point.module || point.module === '1')
      .map((point: any) => ({
        x: (() => {
          let timestamp = point.u || point.unix_ms || point.timestamp;
          if (typeof timestamp === 'string') {
            if (timestamp.includes('-') || timestamp.includes('/')) {
              return new Date(timestamp);
            } else {
              timestamp = parseInt(timestamp, 10);
            }
          }
          if (typeof timestamp === 'number') {
            if (timestamp < 1000000000000) {
              timestamp = timestamp * 1000;
            }
            return new Date(timestamp);
          }
          console.warn('Invalid timestamp:', timestamp, 'using current time');
          return new Date();
        })(),
        y: point.f || point.tempF || point.temperature
      }));

    const insideData = recentPoints
      .filter((point: any) => point.module === '2')
      .map((point: any) => ({
        x: (() => {
          let timestamp = point.u || point.unix_ms || point.timestamp;
          if (typeof timestamp === 'string') {
            if (timestamp.includes('-') || timestamp.includes('/')) {
              return new Date(timestamp);
            } else {
              timestamp = parseInt(timestamp, 10);
            }
          }
          if (typeof timestamp === 'number') {
            if (timestamp < 1000000000000) {
              timestamp = timestamp * 1000;
            }
            return new Date(timestamp);
          }
          console.warn('Invalid timestamp:', timestamp, 'using current time');
          return new Date();
        })(),
        y: point.f || point.tempF || point.temperature
      }));

    console.log('Outside data points:', outsideData.length);
    console.log('Inside data points:', insideData.length);
    console.log('Sample outside data:', outsideData.slice(0, 3));
    console.log('Sample inside data:', insideData.slice(0, 3));

    const chartData = {
      datasets: [
        {
          label: 'Outside (°F)',
          data: outsideData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          spanGaps: true
        },
        {
          label: 'Inside (°F)',
          data: insideData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          spanGaps: true
        }
      ]
    };

    console.log('Chart data prepared:', chartData);
    console.log('Chart data sample:', chartData.datasets[0].data.slice(0, 3));
    return chartData;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();

         return (
     <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-3xl transition-all duration-500 group" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
       <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
         <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center">
           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
             <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
           </div>
           <span className="hidden sm:inline">Temperature History</span>
           <span className="sm:hidden">Temp History</span>
         </h2>
                   <div className="text-sm sm:text-base text-gray-600 font-semibold bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full">
            Last 24 hours
          </div>
       </div>

             {chartData.datasets[0].data.length > 0 ? (
         <div className="flex-1" style={{ height: 'calc(100% - 80px)', minHeight: '200px', maxHeight: '300px' }}>
           <Line options={chartOptions} data={chartData} />
         </div>
       ) : (
         <div className="text-center py-8 sm:py-12 lg:py-16 text-gray-500 h-full flex flex-col justify-center">
           <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
           <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Historical Data</p>
           <p className="text-xs sm:text-sm">Temperature history will appear here once data is collected</p>
         </div>
       )}
    </div>
  );
};

export default ChartPanelNew;
