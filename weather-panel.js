/**
 * Local Weather Panel for ESP8266 Smart Home Dashboard
 * 
 * Fetches weather data from Open-Meteo API with geolocation support.
 * API URL: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&current=temperature_2m,wind_speed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10
 * 
 * Features:
 * - Geolocation with Concord, CA fallback
 * - 60-minute caching with localStorage
 * - Auto-refresh with visibility detection
 * - °F/°C unit toggle
 * - Responsive design
 * - Error handling with cached data fallback
 */

// Weather code mapping
const WEATHER_CODES = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Cloudy', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Foggy', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌦️' },
  56: { label: 'Light Freezing Drizzle', icon: '🌨️' },
  57: { label: 'Freezing Drizzle', icon: '🌨️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  66: { label: 'Light Freezing Rain', icon: '🌨️' },
  67: { label: 'Freezing Rain', icon: '🌨️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy Snow', icon: '🌨️' },
  77: { label: 'Snow Grains', icon: '🌨️' },
  80: { label: 'Light Showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌦️' },
  82: { label: 'Heavy Showers', icon: '🌦️' },
  85: { label: 'Light Snow Showers', icon: '🌨️' },
  86: { label: 'Snow Showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { label: 'Heavy Thunderstorm', icon: '⛈️' }
};

// Helper functions
const formatDay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const formatTemp = (temp, unit) => {
  return `${Math.round(temp)}°${unit}`;
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const mapWeatherCode = (code) => {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: '❓' };
};

const buildUrl = (lat, lon, unit) => {
  const tempUnit = unit === 'C' ? 'celsius' : 'fahrenheit';
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=mph&precipitation_unit=inch&current=temperature_2m,wind_speed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10`;
};

const loadCache = () => {
  try {
    const cached = localStorage.getItem('weatherCache');
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.cachedAt;
      if (age < 60 * 60 * 1000) { // 60 minutes
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load weather cache:', error);
  }
  return null;
};

const saveCache = (data) => {
  try {
    localStorage.setItem('weatherCache', JSON.stringify({
      ...data,
      cachedAt: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save weather cache:', error);
  }
};

// Weather Panel Class
class WeatherPanel {
  constructor() {
    this.weatherData = null;
    this.loading = true;
    this.error = null;
    this.location = { lat: 37.9722, lon: -122.0016, city: 'Concord, CA 94518' };
    this.unit = localStorage.getItem('weatherUnit') || 'F';
    this.lastUpdated = null;
    this.isRefreshing = false;
    this.fetchInProgress = false;
    this.refreshTimeout = null;
    this.intervalRef = null;
    
    this.init();
  }

  async init() {
    this.createWeatherPanel();
    this.getUserLocation();
    
    // Load cached data or fetch fresh
    const cached = loadCache();
    if (cached) {
      this.weatherData = cached;
      this.lastUpdated = cached.cachedAt;
      this.loading = false;
      this.updateDisplay();
    } else {
      await this.fetchWeatherData();
    }
    
    this.startAutoRefresh();
  }

  createWeatherPanel() {
    const mainContent = document.querySelector('.main-content');
    
    // Create weather panel HTML
    const weatherPanel = document.createElement('section');
    weatherPanel.className = 'card weather-card';
    weatherPanel.innerHTML = `
      <div class="card-header">
        <h2><i class="fas fa-cloud-sun"></i> Local Weather</h2>
        <div class="weather-controls">
          <button class="unit-toggle" onclick="weatherPanel.toggleUnit()">
            °${this.unit}
          </button>
          <button class="refresh-btn" onclick="weatherPanel.handleRefresh()">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="card-content weather-content">
        <div class="weather-loading" id="weather-loading">
          <div class="loading-spinner"></div>
          <p>Loading weather data...</p>
        </div>
        <div class="weather-error" id="weather-error" style="display: none;">
          <div class="error-icon">🌧️</div>
          <h3>Can't Load Weather</h3>
          <p>Unable to fetch weather data</p>
          <button class="retry-btn" onclick="weatherPanel.handleRefresh()">Retry</button>
        </div>
        <div class="weather-data" id="weather-data" style="display: none;">
          <div class="current-weather">
            <div class="weather-header">
              <h3 id="weather-title">Local Weather — Concord: --°F</h3>
            </div>
            <div class="current-conditions">
              <div class="temp-display">
                <div class="current-temp" id="current-temp">--°F</div>
                <div class="weather-desc" id="weather-desc">--</div>
                <div class="wind-info" id="wind-info">Wind: -- mph</div>
              </div>
              <div class="weather-icon" id="weather-icon">--</div>
            </div>
            <div class="last-updated" id="last-updated"></div>
          </div>
          <div class="error-notice" id="error-notice" style="display: none;">
            <div class="notice-content">
              ⚠️ Showing cached data. <span id="error-message"></span>
            </div>
          </div>
          <div class="forecast-section">
            <h4>10-Day Forecast</h4>
            <div class="forecast-container">
              <div class="forecast-scroll" id="forecast-scroll">
                <!-- Forecast days will be inserted here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert after the real-temp-card
    const realTempCard = document.querySelector('.real-temp-card');
    if (realTempCard) {
      realTempCard.parentNode.insertBefore(weatherPanel, realTempCard.nextSibling);
    } else {
      mainContent.appendChild(weatherPanel);
    }
  }

  async fetchWeatherData(force = false) {
    if (this.fetchInProgress && !force) return;
    
    this.fetchInProgress = true;
    this.loading = true;
    this.error = null;
    this.updateDisplay();

    try {
      const url = buildUrl(this.location.lat, this.location.lon, this.unit);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.weatherData = {
        current: data.current,
        daily: data.daily,
        location: this.location.city
      };
      
      this.lastUpdated = Date.now();
      saveCache(this.weatherData);
      this.error = null;
    } catch (err) {
      console.error('Weather fetch failed:', err);
      this.error = err.message;
      
      // Try to load cached data on error
      const cached = loadCache();
      if (cached) {
        this.weatherData = cached;
        this.lastUpdated = cached.cachedAt;
      }
    } finally {
      this.loading = false;
      this.isRefreshing = false;
      this.fetchInProgress = false;
      this.updateDisplay();
    }
  }

  getUserLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using Concord, CA');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.location = { lat: latitude, lon: longitude, city: 'Your Location' };
        this.fetchWeatherData();
      },
      (error) => {
        console.log('Geolocation denied, using Concord, CA:', error.message);
        this.location = { lat: 37.9722, lon: -122.0016, city: 'Concord, CA 94518' };
        this.fetchWeatherData();
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  toggleUnit() {
    this.unit = this.unit === 'F' ? 'C' : 'F';
    localStorage.setItem('weatherUnit', this.unit);
    this.fetchWeatherData(true);
  }

  handleRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = setTimeout(() => {
      this.fetchWeatherData(true);
    }, 10000); // 10 second debounce
  }

  startAutoRefresh() {
    this.intervalRef = setInterval(() => {
      if (!document.hidden) {
        this.fetchWeatherData();
      }
    }, 60 * 60 * 1000); // 60 minutes

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.intervalRef) clearInterval(this.intervalRef);
      } else {
        this.startAutoRefresh();
      }
    });
  }

  updateDisplay() {
    const loadingEl = document.getElementById('weather-loading');
    const errorEl = document.getElementById('weather-error');
    const dataEl = document.getElementById('weather-data');
    const errorNotice = document.getElementById('error-notice');

    if (this.loading && !this.weatherData) {
      loadingEl.style.display = 'block';
      errorEl.style.display = 'none';
      dataEl.style.display = 'none';
      return;
    }

    if (this.error && !this.weatherData) {
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      dataEl.style.display = 'none';
      return;
    }

    if (!this.weatherData) return;

    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    dataEl.style.display = 'block';

    // Update current weather
    const { current, daily, location: cityName } = this.weatherData;
    const currentWeather = mapWeatherCode(current.weathercode);

    // Update title
    const titleEl = document.getElementById('weather-title');
    titleEl.textContent = `Local Weather — ${cityName}: ${formatTemp(current.temperature_2m, this.unit)}`;

    // Update current conditions
    document.getElementById('current-temp').textContent = formatTemp(current.temperature_2m, this.unit);
    document.getElementById('weather-desc').textContent = currentWeather.label;
    document.getElementById('wind-info').textContent = `Wind: ${Math.round(current.wind_speed_10m)} mph`;
    document.getElementById('weather-icon').textContent = currentWeather.icon;

    // Update last updated time
    if (this.lastUpdated) {
      document.getElementById('last-updated').textContent = `Last updated: ${formatTime(this.lastUpdated)}`;
    }

    // Show error notice if there's an error but we have cached data
    if (this.error) {
      errorNotice.style.display = 'block';
      document.getElementById('error-message').textContent = this.error;
    } else {
      errorNotice.style.display = 'none';
    }

    // Update forecast
    this.updateForecast(daily);
  }

  updateForecast(daily) {
    const forecastScroll = document.getElementById('forecast-scroll');
    forecastScroll.innerHTML = '';

    daily.time.forEach((date, index) => {
      const weather = mapWeatherCode(daily.weathercode[index]);
      const high = daily.temperature_2m_max[index];
      const low = daily.temperature_2m_min[index];
      const precip = daily.precipitation_probability_max[index];

      const dayEl = document.createElement('div');
      dayEl.className = 'forecast-day';
      dayEl.innerHTML = `
        <div class="day-name">${formatDay(date)}</div>
        <div class="day-icon">${weather.icon}</div>
        <div class="day-high">${formatTemp(high, this.unit)}</div>
        <div class="day-low">${formatTemp(low, this.unit)}</div>
        ${precip > 0 ? `<div class="day-precip">${Math.round(precip)}%</div>` : ''}
      `;

      forecastScroll.appendChild(dayEl);
    });
  }
}

// Initialize weather panel when DOM is loaded
let weatherPanel;
document.addEventListener('DOMContentLoaded', () => {
  weatherPanel = new WeatherPanel();
});
