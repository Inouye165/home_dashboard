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
  series?: Array<{
    timestamp: string;
    temperature: number;
    humidity: number;
    pressure: number;
  }>;
}

export const useESP8266Data = () => {
  const [data, setData] = useState<ESP8266Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch data from both modules
      const [module113Response, module115Response, seriesResponse] = await Promise.allSettled([
        fetch('/api/esp8266/113/json'),
        fetch('/api/esp8266/115/json'),
        fetch('/api/esp8266/series')
      ]);

      const newData: ESP8266Data = {};

      // Process module 113 data
      if (module113Response.status === 'fulfilled' && module113Response.value.ok) {
        const module113Data = await module113Response.value.json();
        newData.module113 = module113Data;
      }

      // Process module 115 data
      if (module115Response.status === 'fulfilled' && module115Response.value.ok) {
        const module115Data = await module115Response.value.json();
        newData.module115 = module115Data;
      }

      // Process series data
      if (seriesResponse.status === 'fulfilled' && seriesResponse.value.ok) {
        const seriesData = await seriesResponse.value.json();
        newData.series = seriesData;
      }

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
