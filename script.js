// Dashboard functionality
class Dashboard {
    constructor() {
        this.temperatureData = {
            outside: { temp: 22.5, humidity: 65, lastUpdate: Date.now() },
            inside: { temp: 21.8, humidity: 45, lastUpdate: Date.now() },
            garage: { temp: 19.2, humidity: 55, lastUpdate: Date.now() }
        };
        
        this.deviceStates = {
            livingLight: false,
            kitchenLight: false,
            fan: false,
            heater: false
        };
        
        this.realTempData = null; // Store real ESP8266 data (outside from module 113)
        this.realInsideTempData = null; // Store real ESP8266 data (inside from module 115)
        
        this.init();
    }

    init() {
        this.updateDateTime();
        this.updateCalendar();
        this.setupEventListeners();
        this.startDataSimulation();
        
        // Initialize outside temperature display
        this.updateOutsideTempDisplay();
        
        // Update time every second
        setInterval(() => {
            this.updateDateTime();
        }, 1000);
        
        // Update calendar every minute
        setInterval(() => {
            this.updateCalendar();
        }, 60000);
    }

    updateDateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    updateCalendar() {
        const now = new Date();
        const dateElement = document.getElementById('calendar-date');
        const dayElement = document.getElementById('calendar-day');
        const monthElement = document.getElementById('calendar-month');
        
        if (dateElement) {
            dateElement.textContent = now.getDate();
        }
        
        if (dayElement) {
            dayElement.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        if (monthElement) {
            monthElement.textContent = now.toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
            });
        }
    }

    setupEventListeners() {
        // Add any additional event listeners here
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Dashboard loaded successfully');
        });
    }

    startDataSimulation() {
        // Simulate temperature changes every 30 seconds
        setInterval(() => {
            this.simulateTemperatureChanges();
        }, 30000);
    }

    simulateTemperatureChanges() {
        // Simulate realistic temperature variations
        const variations = {
            inside: { temp: [-0.5, 0.5], humidity: [-3, 3] },
            garage: { temp: [-1, 1], humidity: [-4, 4] }
        };

        // Only simulate inside and garage temperatures
        // Outside temperature will be handled by real ESP8266 data
        Object.keys(variations).forEach(location => {
            const current = this.temperatureData[location];
            const variation = variations[location];
            
            // Add random variation
            current.temp += (Math.random() - 0.5) * (variation.temp[1] - variation.temp[0]);
            current.humidity += (Math.random() - 0.5) * (variation.humidity[1] - variation.humidity[0]);
            
            // Keep values within reasonable bounds
            current.temp = Math.max(10, Math.min(35, current.temp));
            current.humidity = Math.max(20, Math.min(90, current.humidity));
            
            current.lastUpdate = Date.now();
            
            this.updateTemperatureDisplay(location, current);
        });
    }

    updateTemperatureDisplay(location, data) {
        const tempElement = document.getElementById(`${location}-temp`);
        if (tempElement) {
            const oldValue = tempElement.textContent;
            let newValue;
            let dataSource = 'simulated';
            
            // Use real ESP8266 data for outside temperature (module 113)
            if (location === 'outside' && this.realTempData) {
                newValue = `${this.realTempData.temp.toFixed(1)}°F`;
                dataSource = 'ESP8266@10.0.0.113';
            }
            // Use real ESP8266 data for inside temperature (module 115)
            else if (location === 'inside' && this.realInsideTempData) {
                newValue = `${this.realInsideTempData.temp.toFixed(1)}°F`;
                dataSource = 'ESP8266@10.0.0.115';
            } else {
                newValue = `${data.temp.toFixed(1)}°C`;
            }
            
            console.log(`${location} temperature: ${newValue} (${dataSource})`);
            tempElement.textContent = newValue;
            
            // Add animation if value changed
            if (oldValue !== newValue) {
                tempElement.classList.add('updated');
                setTimeout(() => {
                    tempElement.classList.remove('updated');
                }, 500);
            }
        }
        
        // Update humidity and last update time
        const tempSensor = tempElement?.closest('.temp-sensor');
        if (tempSensor) {
            const details = tempSensor.querySelector('.temp-details');
            if (details) {
                const humiditySpan = details.querySelector('span:first-child');
                const updateSpan = details.querySelector('span:last-child');
                
                if (humiditySpan) {
                    if (location === 'outside' && this.realTempData) {
                        humiditySpan.textContent = `Live from ESP8266@10.0.0.113`;
                    } else if (location === 'inside' && this.realInsideTempData) {
                        humiditySpan.textContent = `Live from ESP8266@10.0.0.115`;
                    } else {
                        humiditySpan.textContent = `Humidity: ${Math.round(data.humidity)}%`;
                    }
                }
                
                if (updateSpan) {
                    if (location === 'outside' && this.realTempData) {
                        updateSpan.textContent = `Outside Temperature`;
                    } else if (location === 'inside' && this.realInsideTempData) {
                        updateSpan.textContent = `Inside Temperature`;
                    } else {
                        const minutesAgo = Math.floor((Date.now() - data.lastUpdate) / 60000);
                        updateSpan.textContent = `Updated: ${minutesAgo} min ago`;
                    }
                }
            }
        }
    }

    // Add method to update with real ESP8266 data
    updateWithRealTempData(realTempData) {
        console.log('Updating outside temperature with:', realTempData);
        
        // Prevent overwriting with stale data
        if (this.realTempData && this.realTempData.time) {
            const timeDiff = Math.abs(Date.now() - this.realTempData.time.getTime());
            if (timeDiff > 300000) { // 5 minutes
                console.log('Ignoring stale outside temperature data');
                return;
            }
        }
        
        this.realTempData = realTempData;
        if (realTempData) {
            // Update the outside temperature display with real ESP8266 data
            this.updateOutsideTempDisplay();
        }
    }

    // Add method to update with real inside ESP8266 data (module 115)
    updateWithRealInsideTempData(realInsideTempData) {
        console.log('Updating inside temperature with:', realInsideTempData);
        
        // Prevent overwriting with stale data
        if (this.realInsideTempData && this.realInsideTempData.time) {
            const timeDiff = Math.abs(Date.now() - this.realInsideTempData.time.getTime());
            if (timeDiff > 300000) { // 5 minutes
                console.log('Ignoring stale inside temperature data');
                return;
            }
        }
        
        this.realInsideTempData = realInsideTempData;
        if (realInsideTempData) {
            // Update the inside temperature display with real ESP8266 data
            this.updateTemperatureDisplay('inside', { temp: realInsideTempData.temp, humidity: 0, lastUpdate: Date.now() });
        }
    }

    updateOutsideTempDisplay() {
        // Update outside temperature display - will show real data if available, otherwise placeholder
        if (this.realTempData) {
            this.updateTemperatureDisplay('outside', { temp: this.realTempData.temp, humidity: 0, lastUpdate: Date.now() });
        } else {
            // Show placeholder until real data arrives
            const tempElement = document.getElementById('outside-temp');
            if (tempElement) {
                tempElement.textContent = '--°F';
            }
            
            const tempSensor = tempElement?.closest('.temp-sensor');
            if (tempSensor) {
                const details = tempSensor.querySelector('.temp-details');
                if (details) {
                    const humiditySpan = details.querySelector('span:first-child');
                    const updateSpan = details.querySelector('span:last-child');
                    
                    if (humiditySpan) {
                        humiditySpan.textContent = `Waiting for ESP8266@10.0.0.113...`;
                    }
                    
                    if (updateSpan) {
                        updateSpan.textContent = `Connecting...`;
                    }
                }
            }
        }
    }
}

// Global functions for button interactions
function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.classList.add('loading');
    
    // Simulate API call delay
    setTimeout(() => {
        dashboard.simulateTemperatureChanges();
        refreshBtn.classList.remove('loading');
        
        // Show notification
        showNotification('Data refreshed successfully!', 'success');
    }, 1000);
}

function toggleLight(location) {
    const button = event.target.closest('.action-btn');
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        button.classList.remove('active');
        dashboard.deviceStates[`${location}Light`] = false;
        showNotification(`${location.charAt(0).toUpperCase() + location.slice(1)} light turned off`, 'info');
    } else {
        button.classList.add('active');
        dashboard.deviceStates[`${location}Light`] = true;
        showNotification(`${location.charAt(0).toUpperCase() + location.slice(1)} light turned on`, 'success');
    }
}

function toggleFan() {
    const button = event.target.closest('.action-btn');
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        button.classList.remove('active');
        dashboard.deviceStates.fan = false;
        showNotification('Ceiling fan turned off', 'info');
    } else {
        button.classList.add('active');
        dashboard.deviceStates.fan = true;
        showNotification('Ceiling fan turned on', 'success');
    }
}

function toggleHeater() {
    const button = event.target.closest('.action-btn');
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        button.classList.remove('active');
        dashboard.deviceStates.heater = false;
        showNotification('Heater turned off', 'info');
    } else {
        button.classList.add('active');
        dashboard.deviceStates.heater = true;
        showNotification('Heater turned on', 'success');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#48bb78';
        case 'error': return '#e53e3e';
        case 'warning': return '#ed8936';
        default: return '#667eea';
    }
}

// ESP8266 API simulation functions
class ESP8266API {
    static async getTemperatureData() {
        // Simulate API call to ESP8266
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    outside: { temp: 22.5 + (Math.random() - 0.5) * 4, humidity: 65 + (Math.random() - 0.5) * 10 },
                    inside: { temp: 21.8 + (Math.random() - 0.5) * 2, humidity: 45 + (Math.random() - 0.5) * 6 },
                    garage: { temp: 19.2 + (Math.random() - 0.5) * 3, humidity: 55 + (Math.random() - 0.5) * 8 }
                });
            }, 500);
        });
    }

    static async toggleDevice(deviceId, state) {
        // Simulate API call to control ESP8266 devices
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Device ${deviceId} ${state ? 'turned on' : 'turned off'}`);
                resolve({ success: true, deviceId, state });
            }, 300);
        });
    }
}

// Real Temperature Monitor
class RealTempMonitor {
    constructor() {
        this.currentTemp = null;
        this.tempHistory = [];
        this.outsideTempHistory = []; // Add outside temperature history
        this.chart = null;
        this.updateInterval = null;
        this.esp8266Url = '/api/esp8266'; // Use proxy instead of direct ESP8266 URL
        this.esp8266Url115 = '/api/esp8266/115'; // Module 115 for chart data (has timestamps)
        this.esp8266Url113 = '/api/esp8266/113'; // Module 113 for outside temp (no timestamps)
        
        this.init();
    }

    async init() {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create chart immediately
        this.createChart();
        
        // Then fetch data
        await this.fetchCurrentTemp();
        await this.fetchOutsideTemp();
        await this.fetchTempHistory();
        this.startAutoUpdate();
    }

    async fetchCurrentTemp() {
        try {
            // Fetch from module 115 (has timestamps) for chart data
            const response115 = await fetch(`${this.esp8266Url115}/json`);
            if (!response115.ok) throw new Error(`HTTP ${response115.status}`);
            
            const data115 = await response115.json();
            console.log('Module 115 data (inside):', data115);
            
            this.currentTemp = {
                temp: data115.tempF,
                time: new Date(data115.unix_ms),
                timeStr: data115.time_str
            };
            
            this.updateCurrentTempDisplay();
            this.updateStatus('connected');
            
            // Update dashboard with inside temperature data (module 115)
            if (window.dashboard) {
                window.dashboard.updateWithRealInsideTempData(this.currentTemp);
            }
            
        } catch (error) {
            console.error('Error fetching current temperature:', error);
            this.updateStatus('error', error.message);
        }
    }

    async fetchOutsideTemp() {
        try {
            // Fetch from module 113 (outside) for dashboard display
            const response113 = await fetch(`${this.esp8266Url113}/json`);
            if (!response113.ok) throw new Error(`HTTP ${response113.status}`);
            
            const data113 = await response113.json();
            console.log('Module 113 data (outside):', data113);
            
            const outsideTemp = {
                temp: data113.tempF,
                time: new Date(data113.unix_ms), // Use actual timestamp from module 113
                timeStr: data113.time_str
            };
            
            // Add to outside temperature history for chart
            this.outsideTempHistory.push(outsideTemp);
            console.log('Added outside temp to history:', outsideTemp);
            console.log('Outside temp history length:', this.outsideTempHistory.length);
            
            // Keep only last 100 points to prevent memory issues
            if (this.outsideTempHistory.length > 100) {
                this.outsideTempHistory = this.outsideTempHistory.slice(-100);
            }
            
            // Update dashboard with outside temperature data
            if (window.dashboard) {
                window.dashboard.updateWithRealTempData(outsideTemp);
            }
            
            // Update chart with both datasets
            this.updateChart();
            
        } catch (error) {
            console.error('Error fetching outside temperature:', error);
        }
    }

    async fetchTempHistory() {
        try {
            // Use module 115 for inside temperature history (has timestamps)
            const response115 = await fetch(`${this.esp8266Url115}/series`);
            if (!response115.ok) throw new Error(`HTTP ${response115.status}`);
            
            const data115 = await response115.json();
            console.log('Raw ESP8266 data (module 115 - inside):', data115);
            
            // Filter out invalid timestamps and create valid data points for inside temperature
            this.tempHistory = data115.points
                .filter(point => point.u && point.u > 0 && point.f && !isNaN(point.f))
                .map(point => ({
                    time: new Date(point.u),
                    temp: point.f
                }));
            
            console.log('Processed inside temperature history:', this.tempHistory);
            console.log('Number of inside data points:', this.tempHistory.length);
            
            // Check for data anomalies
            if (this.tempHistory.length > 0) {
                const temps = this.tempHistory.map(p => p.temp);
                const minTemp = Math.min(...temps);
                const maxTemp = Math.max(...temps);
                console.log('Inside temperature range in history:', minTemp, 'to', maxTemp);
                
                if (maxTemp - minTemp < 5) {
                    console.warn('⚠️ Very narrow inside temperature range detected - possible data issue');
                }
            }
            
            // Now fetch outside temperature history from module 113
            const response113 = await fetch(`${this.esp8266Url113}/series`);
            if (response113.ok) {
                const data113 = await response113.json();
                console.log('Raw ESP8266 data (module 113 - outside):', data113);
                
                // Filter out invalid timestamps and create valid data points for outside temperature
                const outsideHistory = data113.points
                    .filter(point => point.u && point.u > 0 && point.f && !isNaN(point.f))
                    .map(point => ({
                        time: new Date(point.u),
                        temp: point.f
                    }));
                
                console.log('Processed outside temperature history:', outsideHistory);
                console.log('Number of outside data points:', outsideHistory.length);
                
                // Replace the outside temperature history with the actual series data
                this.outsideTempHistory = outsideHistory;
                
                // Check for data anomalies
                if (this.outsideTempHistory.length > 0) {
                    const temps = this.outsideTempHistory.map(p => p.temp);
                    const minTemp = Math.min(...temps);
                    const maxTemp = Math.max(...temps);
                    console.log('Outside temperature range in history:', minTemp, 'to', maxTemp);
                }
            }
            
            this.updateChart();
            
        } catch (error) {
            console.error('Error fetching temperature history:', error);
        }
    }

    updateCurrentTempDisplay() {
        const tempValue = document.getElementById('real-temp-value');
        const tempTime = document.getElementById('real-temp-time');
        
        if (this.currentTemp && tempValue && tempTime) {
            tempValue.textContent = this.currentTemp.temp.toFixed(1);
            
            // Handle invalid timestamps
            if (this.currentTemp.time && this.currentTemp.time.getTime() > 0) {
                tempTime.textContent = this.currentTemp.time.toLocaleTimeString('en-US', {
                    hour12: true,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } else {
                tempTime.textContent = this.currentTemp.timeStr || 'NTP not set';
            }
            
            // Share data with dashboard immediately (only for inside temperature)
            if (window.dashboard) {
                window.dashboard.updateWithRealInsideTempData(this.currentTemp);
            }
        }
    }

    updateStatus(status, message = '') {
        const statusElement = document.getElementById('real-temp-status');
        if (statusElement) {
            statusElement.className = `temp-status ${status}`;
            
            switch (status) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    break;
                case 'error':
                    statusElement.textContent = `Error: ${message}`;
                    break;
                case 'connecting':
                    statusElement.textContent = 'Connecting...';
                    break;
                default:
                    statusElement.textContent = message || status;
            }
        }
    }

    createChart() {
        const ctx = document.getElementById('tempChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Inside Temperature (°F)',
                        data: [],
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        borderWidth: 1, // Half as wide
                        fill: false,
                        tension: 0.6,
                        pointRadius: 1.5,
                        pointBackgroundColor: '#e53e3e',
                        pointBorderColor: '#e53e3e',
                        pointBorderWidth: 0
                    },
                    {
                        label: 'Outside Temperature (°F)',
                        data: [],
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        borderWidth: 1, // Half as wide
                        fill: false,
                        tension: 0.6,
                        pointRadius: 1.5,
                        pointBackgroundColor: '#3182ce',
                        pointBorderColor: '#3182ce',
                        pointBorderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                                         legend: {
                         display: true,
                         position: 'top',
                         labels: {
                             color: '#718096',
                             usePointStyle: true,
                             padding: 15
                         }
                     },
                                         title: {
                         display: true,
                         text: 'Temperature History (Inside: ESP8266@10.0.0.115, Outside: ESP8266@10.0.0.113)',
                         color: '#718096',
                         font: {
                             size: 14,
                             weight: 'normal'
                         },
                         padding: {
                             top: 10,
                             bottom: 10
                         }
                     },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleTimeString('en-US', {
                                    hour12: true,
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            },
                            label: function(context) {
                                return `Temperature: ${context.parsed.y.toFixed(1)}°F`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm',
                                minute: 'HH:mm'
                            },
                            stepSize: 1
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 8,
                            color: '#718096'
                        },
                        // Ensure all data is visible
                        min: undefined,
                        max: undefined
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#e2e8f0'
                        },
                        ticks: {
                            color: '#718096',
                            callback: function(value) {
                                return value.toFixed(0) + '°F';
                            }
                        },
                        // Ensure all data is visible
                        min: undefined,
                        max: undefined
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        // Filter out invalid timestamps and create valid chart data for inside temperature
        let insideChartData = this.tempHistory.filter(point => 
            point.time && point.time.getTime() > 0 && 
            point.temp && !isNaN(point.temp)
        );

        // Add current inside temperature if it has a valid timestamp
        if (this.currentTemp && this.currentTemp.time && this.currentTemp.time.getTime() > 0) {
            const lastHistoryTime = insideChartData[insideChartData.length - 1]?.time;
            if (!lastHistoryTime || this.currentTemp.time > lastHistoryTime) {
                insideChartData.push(this.currentTemp);
            }
        }

        // Filter outside temperature data
        let outsideChartData = this.outsideTempHistory.filter(point => 
            point.time && point.time.getTime() > 0 && 
            point.temp && !isNaN(point.temp)
        );
        
        console.log('Raw outside temperature history:', this.outsideTempHistory);
        console.log('Filtered outside chart data:', outsideChartData);

        // Only update chart if we have valid data
        if (insideChartData.length > 0 || outsideChartData.length > 0) {
            // Sort by time to ensure chronological order
            insideChartData.sort((a, b) => a.time.getTime() - b.time.getTime());
            outsideChartData.sort((a, b) => a.time.getTime() - b.time.getTime());
            
            console.log('Inside chart data:', insideChartData);
            console.log('Outside chart data:', outsideChartData);
            console.log('Inside data points:', insideChartData.length);
            console.log('Outside data points:', outsideChartData.length);
            
            // Update chart data using proper Chart.js format
            this.chart.data.datasets[0].data = insideChartData.map(point => ({
                x: point.time,
                y: point.temp
            }));
            
            this.chart.data.datasets[1].data = outsideChartData.map(point => ({
                x: point.time,
                y: point.temp
            }));
            
            console.log('Final inside dataset:', this.chart.data.datasets[0].data);
            console.log('Final outside dataset:', this.chart.data.datasets[1].data);
            console.log('Chart datasets length - Inside:', this.chart.data.datasets[0].data.length, 'Outside:', this.chart.data.datasets[1].data.length);
            
            this.chart.update('none'); // Update without animation for better performance
        } else {
            console.log('No valid data to update chart with');
        }
    }

    startAutoUpdate() {
        // Update every 2 minutes (120000ms to match your module's period)
        this.updateInterval = setInterval(async () => {
            await this.fetchCurrentTemp();
            await this.fetchOutsideTemp();
            await this.fetchTempHistory();
        }, 120000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Global function for manual refresh
async function refreshRealTempData() {
    const refreshBtn = document.querySelector('.real-temp-card .refresh-btn');
    refreshBtn.classList.add('loading');
    
    try {
        await realTempMonitor.fetchCurrentTemp();
        await realTempMonitor.fetchOutsideTemp();
        await realTempMonitor.fetchTempHistory();
        showNotification('Temperature data refreshed!', 'success');
    } catch (error) {
        showNotification('Failed to refresh temperature data', 'error');
    } finally {
        refreshBtn.classList.remove('loading');
    }
}

// Initialize dashboard when page loads
let dashboard;
let realTempMonitor;
let sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard session ID:', sessionId);
    
    // Create dashboard first and make it globally available
    dashboard = new Dashboard();
    window.dashboard = dashboard; // Make it globally accessible
    
    // Create RealTempMonitor after dashboard is available
    realTempMonitor = new RealTempMonitor();
    
    // Wait for RealTempMonitor to initialize and get data
    await realTempMonitor.init();
    
    // Force update the outside temperature display with any available data
    if (realTempMonitor.currentTemp) {
        dashboard.updateWithRealInsideTempData(realTempMonitor.currentTemp);
    }
});

// Add some additional CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(notificationStyles);
