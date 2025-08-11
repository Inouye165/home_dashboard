import { useState, useEffect } from 'react';

console.log('__BUILD_TAG__ useESP8266Data v6 - INFINITE LOOP FIX', new Date().toISOString());

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
    console.log('fetchData called');
    try {
      setError(null);
      console.log('Starting fetchData...');
      
      // Fetch data from ESP8266 modules via proxy server
      const [module113Response, module115Response, series113Response, series115Response] = await Promise.allSettled([
        fetch('/api/esp8266/113/json'),
        fetch('/api/esp8266/115/json'),
        fetch('/api/esp8266/113/series'),
        fetch('/api/esp8266/115/series')
      ]);

      const newData: ESP8266Data = {};
      console.log('Starting to process data...');

      // Process module 113 data
      if (module113Response.status === 'fulfilled' && module113Response.value.ok) {
                 const module113Data = await module113Response.value.json();
         console.log('Module 113 data:', module113Data);
         console.log('Module 113 data type:', typeof module113Data);
         console.log('Module 113 data keys:', Object.keys(module113Data));
                 newData.module113 = {
           temperature: module113Data.tempF, // Convert tempF to temperature
           timestamp: module113Data.unix_ms && module113Data.unix_ms > 0 ? new Date(module113Data.unix_ms).toISOString() : module113Data.time_str, // Use unix_ms if available and valid, fallback to time_str
           humidity: module113Data.humidity || undefined,
           pressure: module113Data.pressure || undefined
         };
         console.log('Module 113 processed successfully:', newData.module113);
             } else {
         console.log('Module 113 response failed:', module113Response);
       }
       console.log('After processing Module 113, newData:', newData);

      // Process module 115 data
      if (module115Response.status === 'fulfilled' && module115Response.value.ok) {
                 const module115Data = await module115Response.value.json();
         console.log('Module 115 data:', module115Data);
         console.log('Module 115 data type:', typeof module115Data);
         console.log('Module 115 data keys:', Object.keys(module115Data));
                 newData.module115 = {
           temperature: module115Data.tempF, // Convert tempF to temperature
           timestamp: module115Data.unix_ms && module115Data.unix_ms > 0 ? new Date(module115Data.unix_ms).toISOString() : module115Data.time_str, // Use unix_ms if available and valid, fallback to time_str
           humidity: module115Data.humidity || undefined,
           pressure: module115Data.pressure || undefined
         };
         console.log('Module 115 processed successfully:', newData.module115);
             } else {
         console.log('Module 115 response failed:', module115Response);
       }
       console.log('After processing Module 115, newData:', newData);

      // Process series data from both modules
      const allSeriesPoints: any[] = [];
      
             // Process Module 113 series data
       if (series113Response.status === 'fulfilled' && series113Response.value.ok) {
         try {
           // Read response as text once to avoid body stream issues
           let series113Data;
           const series113Text = await series113Response.value.text();
           console.log('Module 113 series raw response length:', series113Text.length);
           console.log('Module 113 series raw response first 500 chars:', series113Text.substring(0, 500));
           
                      if (series113Text.trim() === '') {
             console.error('Module 113 series response is empty');
             // Continue processing other data instead of returning early
           } else {
             // Enhanced sanitization for potentially truncated JSON
             let sanitizedText = series113Text;
             
             // First, try to detect if the JSON is truncated and attempt to fix it
             const lastBraceIndex = sanitizedText.lastIndexOf('}');
             const lastBracketIndex = sanitizedText.lastIndexOf(']');
             const lastCommaIndex = sanitizedText.lastIndexOf(',');
             
             // If the last character is a comma, remove it
             if (sanitizedText.trim().endsWith(',')) {
               sanitizedText = sanitizedText.trim().slice(0, -1);
             }
             
             // If we have a trailing comma before a closing bracket/brace, remove it
             if (lastCommaIndex > lastBraceIndex && lastCommaIndex > lastBracketIndex) {
               sanitizedText = sanitizedText.substring(0, lastCommaIndex) + sanitizedText.substring(lastCommaIndex + 1);
             }
             
             // Remove trailing commas before closing brackets/braces (more aggressive)
             sanitizedText = sanitizedText.replace(/,+(\s*[}\]])/g, '$1');
             
             // Remove trailing commas at the end of the string
             sanitizedText = sanitizedText.replace(/,+(\s*)$/g, '$1');
             
             // Remove any remaining trailing commas before closing brackets (catch edge cases)
             sanitizedText = sanitizedText.replace(/,+(\s*})/g, '$1');
             sanitizedText = sanitizedText.replace(/,+(\s*\])/g, '$1');
             
             // Remove multiple consecutive commas anywhere
             sanitizedText = sanitizedText.replace(/,{2,}/g, ',');
             
                           // If the JSON appears to be truncated (missing closing brackets), try to complete it
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const openBraces = (sanitizedText.match(/\{/g) || []).length;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const closeBraces = (sanitizedText.match(/\}/g) || []).length;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const openBrackets = (sanitizedText.match(/\[/g) || []).length;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const closeBrackets = (sanitizedText.match(/\]/g) || []).length;
             
             // Add missing closing brackets/braces (fixed infinite loop)
             const opens  = (sanitizedText.match(/\{/g)  ?? []).length;
             const closes = (sanitizedText.match(/\}/g)  ?? []).length;
             const openSq  = (sanitizedText.match(/\[/g) ?? []).length;
             const closeSq = (sanitizedText.match(/\]/g) ?? []).length;

             // Add missing closing brackets/braces with safety limits
             const maxToAdd = 10; // Prevent runaway loops
             if (closes < opens) {
               const toAdd = Math.min(opens - closes, maxToAdd);
               sanitizedText += '}'.repeat(toAdd);
               if (opens - closes > maxToAdd) {
                 console.warn('Module 113: Too many missing braces, limiting to', maxToAdd);
               }
             }
             if (closeSq < openSq) {
               const toAdd = Math.min(openSq - closeSq, maxToAdd);
               sanitizedText += ']'.repeat(toAdd);
               if (openSq - closeSq > maxToAdd) {
                 console.warn('Module 113: Too many missing brackets, limiting to', maxToAdd);
               }
             }
            
            console.log('Sanitized JSON (first 500 chars):', sanitizedText.substring(0, 500));
            console.log('Sanitized JSON (last 200 chars):', sanitizedText.substring(Math.max(0, sanitizedText.length - 200)));
            
            // Try to parse the sanitized JSON
            try {
              series113Data = JSON.parse(sanitizedText);
              console.log('Module 113 series data (JSON):', series113Data);
            } catch (parseError) {
              console.error('Module 113 series JSON parse error after sanitization:', parseError);
              console.error('Module 113 series raw response that failed to parse:', series113Text);
              // Continue processing other data instead of returning early
            }
            
            if (series113Data && series113Data.points) {
              // Preserve original module identifier or use '113' if not present
              const module113Points = series113Data.points.map((point: any) => ({
                ...point,
                module: point.module || '113' // Use existing module or default to '113'
              }));
              allSeriesPoints.push(...module113Points);
              console.log('Module 113 series processed successfully, added', series113Data.points.length, 'points');
              console.log('Module 113 sample points:', module113Points.slice(0, 3).map((p: any) => ({ module: p.module, f: p.f, u: p.u })));
            } else {
              console.error('Module 113 series data does not have expected structure:', series113Data);
            }
           }
         } catch (seriesError) {
           console.error('Module 113 series processing failed:', seriesError);
         }
       } else {
         console.log('Module 113 series response failed:', series113Response);
       }

             // Process Module 115 series data
       if (series115Response.status === 'fulfilled' && series115Response.value.ok) {
         try {
           // Read response as text once to avoid body stream issues
           let series115Data;
           const series115Text = await series115Response.value.text();
           console.log('Module 115 series raw response length:', series115Text.length);
           console.log('Module 115 series raw response first 500 chars:', series115Text.substring(0, 500));
           
                      if (series115Text.trim() === '') {
             console.error('Module 115 series response is empty');
             // Continue processing other data instead of returning early
           } else {
             // Sanitize the JSON by removing trailing commas and fixing common issues
             let sanitizedText = series115Text;
             
             // Remove trailing commas before closing brackets/braces (more aggressive)
             sanitizedText = sanitizedText.replace(/,+(\s*[}\]])/g, '$1');
             
             // Remove trailing commas at the end of the string
             sanitizedText = sanitizedText.replace(/,+(\s*)$/g, '$1');
             
             // Remove any remaining trailing commas before closing brackets (catch edge cases)
             sanitizedText = sanitizedText.replace(/,+(\s*})/g, '$1');
             sanitizedText = sanitizedText.replace(/,+(\s*\])/g, '$1');
             
             // Remove multiple consecutive commas anywhere
             sanitizedText = sanitizedText.replace(/,{2,}/g, ',');
            
            console.log('Sanitized JSON (first 500 chars):', sanitizedText.substring(0, 500));
            
            // Try to parse the sanitized JSON
            try {
              series115Data = JSON.parse(sanitizedText);
              console.log('Module 115 series data (JSON):', series115Data);
            } catch (parseError) {
              console.error('Module 115 series JSON parse error after sanitization:', parseError);
              console.error('Module 115 series raw response that failed to parse:', series115Text);
              // Continue processing other data instead of returning early
            }
            
            if (series115Data && series115Data.points) {
              // Force module 115 identifier regardless of what's in the JSON
              const module115Points = series115Data.points.map((point: any) => ({
                ...point,
                module: '115' // Force module 115 identifier
              }));
              allSeriesPoints.push(...module115Points);
              console.log('Module 115 series processed successfully, added', series115Data.points.length, 'points');
              console.log('Module 115 sample points:', module115Points.slice(0, 3).map((p: any) => ({ module: p.module, f: p.f, u: p.u })));
            } else {
              console.error('Module 115 series data does not have expected structure:', series115Data);
            }
           }
         } catch (seriesError) {
           console.error('Module 115 series processing failed:', seriesError);
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
      console.log('Setting data with:', newData);
      setData(newData);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchData:', err);
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
