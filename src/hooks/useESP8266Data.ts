import { useState, useEffect } from 'react';

export interface ESP8266Data {
  module113?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    timestamp?: string;
  };
  module115?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    timestamp?: string;
  };
  series?: {
    rev: string;
    period_ms: number;
    points: Array<{
      u?: number; // Unix timestamp
      f?: number; // Temperature in Fahrenheit
      module?: string; // Module identifier
      [key: string]: any;
    }>;
  };
}

export const useESP8266Data = () => {
  const [data, setData] = useState<ESP8266Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch data from ESP8266 modules via proxy server
      const [module113Response, module115Response, series113Response, series115Response] = await Promise.allSettled([
        fetch('/api/esp8266/113/json'),
        fetch('/api/esp8266/115/json'),
        fetch('/api/esp8266/113/series'),
        fetch('/api/esp8266/115/series')
      ]);

      const newData: ESP8266Data = {};

      // Process module 113 data
      if (module113Response.status === 'fulfilled' && module113Response.value.ok) {
        const module113Data = await module113Response.value.json();
        console.log('Module 113 data:', module113Data);
        newData.module113 = {
          temperature: module113Data.tempF, // Convert tempF to temperature
          timestamp: module113Data.unix_ms && module113Data.unix_ms > 0 ? new Date(module113Data.unix_ms).toISOString() : module113Data.time_str, // Use unix_ms if available and valid, fallback to time_str
          humidity: module113Data.humidity || null,
          pressure: module113Data.pressure || null
        };
      } else {
        console.log('Module 113 response failed:', module113Response);
      }

      // Process module 115 data
      if (module115Response.status === 'fulfilled' && module115Response.value.ok) {
        const module115Data = await module115Response.value.json();
        console.log('Module 115 data:', module115Data);
        newData.module115 = {
          temperature: module115Data.tempF, // Convert tempF to temperature
          timestamp: module115Data.unix_ms && module115Data.unix_ms > 0 ? new Date(module115Data.unix_ms).toISOString() : module115Data.time_str, // Use unix_ms if available and valid, fallback to time_str
          humidity: module115Data.humidity || null,
          pressure: module115Data.pressure || null
        };
      } else {
        console.log('Module 115 response failed:', module115Response);
      }

      // Process series data from both modules
      const allSeriesPoints: any[] = [];
      
      // Process Module 113 series data
      if (series113Response.status === 'fulfilled' && series113Response.value.ok) {
        const series113Data = await series113Response.value.json();
        console.log('Module 113 series data:', series113Data);
        if (series113Data.points) {
          // Add module identifier to each point
          const module113Points = series113Data.points.map((point: any) => ({
            ...point,
            module: '1' // Module 113
          }));
          allSeriesPoints.push(...module113Points);
        }
      } else {
        console.log('Module 113 series response failed:', series113Response);
      }

      // Process Module 115 series data
      if (series115Response.status === 'fulfilled' && series115Response.value.ok) {
        const series115Data = await series115Response.value.json();
        console.log('Module 115 series data:', series115Data);
        if (series115Data.points) {
          // Add module identifier to each point
          const module115Points = series115Data.points.map((point: any) => ({
            ...point,
            module: '2' // Module 115
          }));
          allSeriesPoints.push(...module115Points);
        }
      } else {
        console.log('Module 115 series response failed:', series115Response);
      }

      // Combine all series data
      if (allSeriesPoints.length > 0) {
        newData.series = {
          rev: 'combined',
          period_ms: 120000, // Default period
          points: allSeriesPoints
        };
        console.log('Combined series data:', newData.series);
      }

      console.log('Final data object:', newData);
      setData(newData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchData };
};
