import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, MapPin } from 'lucide-react';

interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weathercode: number;
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  location: string;
}

const WEATHER_CODES: { [key: number]: { label: string; icon: string } } = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Cloudy', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Foggy', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌦️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy Snow', icon: '🌨️' },
  80: { label: 'Light Showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌦️' },
  82: { label: 'Heavy Showers', icon: '🌦️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { label: 'Heavy Thunderstorm', icon: '⛈️' }
};

const WeatherPanel: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'F' | 'C'>('F');
  const [location, setLocation] = useState({ lat: 37.9722, lon: -122.0016, city: 'Concord, CA 94518' });

  const fetchWeatherData = async (lat: number, lon: number, tempUnit: 'F' | 'C') => {
    try {
      setLoading(true);
      setError(null);
      
      const tempUnitParam = tempUnit === 'C' ? 'celsius' : 'fahrenheit';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&temperature_unit=${tempUnitParam}&wind_speed_unit=mph&precipitation_unit=inch&current=temperature_2m,wind_speed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWeatherData({
        current: data.current,
        daily: data.daily,
        location: location.city
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = () => {
    const newUnit = unit === 'F' ? 'C' : 'F';
    setUnit(newUnit);
    fetchWeatherData(location.lat, location.lon, newUnit);
  };

  const handleRefresh = () => {
    fetchWeatherData(location.lat, location.lon, unit);
  };

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude, city: 'Your Location' });
          fetchWeatherData(latitude, longitude, unit);
        },
        () => {
          // Fallback to Concord, CA
          fetchWeatherData(location.lat, location.lon, unit);
        }
      );
    } else {
      fetchWeatherData(location.lat, location.lon, unit);
    }
  }, []);

  const getWeatherInfo = (code: number) => {
    return WEATHER_CODES[code] || { label: 'Unknown', icon: '❓' };
  };

  const formatDay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

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
          <Cloud className="w-5 h-5 mr-2 text-blue-500" />
          Local Weather
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleUnit}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            °{unit}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-8 text-gray-500">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Unable to load weather data</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : weatherData ? (
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="w-4 h-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-600">{weatherData.location}</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {weatherData.current.temperature_2m.toFixed(1)}°{unit}
            </div>
            <div className="text-lg text-gray-600 mb-2">
              {getWeatherInfo(weatherData.current.weathercode).icon} {getWeatherInfo(weatherData.current.weathercode).label}
            </div>
            <div className="text-sm text-gray-500">
              Wind: {weatherData.current.wind_speed_10m.toFixed(0)} mph
            </div>
          </div>

          {/* 10-Day Forecast */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">10-Day Forecast</h3>
            <div className="grid grid-cols-5 gap-2">
              {weatherData.daily.time.slice(0, 10).map((date, index) => {
                const weather = getWeatherInfo(weatherData.daily.weathercode[index]);
                const high = weatherData.daily.temperature_2m_max[index];
                const low = weatherData.daily.temperature_2m_min[index];
                const precip = weatherData.daily.precipitation_probability_max[index];
                
                return (
                  <div key={date} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">{formatDay(date)}</div>
                    <div className="text-lg mb-1">{weather.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">{high.toFixed(0)}°</div>
                    <div className="text-xs text-gray-500">{low.toFixed(0)}°</div>
                    {precip > 0 && (
                      <div className="text-xs text-blue-600 mt-1">{precip.toFixed(0)}%</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No weather data available</p>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;
