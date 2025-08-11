import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { ESP8266Data } from '../hooks/useESP8266Data';

interface TempPanelProps {
  data: ESP8266Data | null;
  loading: boolean;
}

const TempPanel: React.FC<TempPanelProps> = ({ data, loading }) => {
  const module113Data = data?.module113;
  const module115Data = data?.module115;

  // Debug logging
  console.log('TempPanel received data:', data);
  console.log('Module 113 data:', module113Data);
  console.log('Module 115 data:', module115Data);

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
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-5 lg:p-6 hover:shadow-3xl transition-all duration-500 h-full group">
              <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="hidden sm:inline">Temperature Sensors</span>
            <span className="sm:hidden">Temp</span>
          </h2>
          <div className="text-sm sm:text-base text-gray-600 font-semibold bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full">
            Outside & Inside
          </div>
        </div>

             <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                 {/* Module 113 - Outside */}
         {module113Data && (
           <div className="bg-gradient-to-br from-orange-50/80 to-red-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                 <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                   <span className="text-white text-xs sm:text-sm font-bold">O</span>
                 </div>
                 Outside
               </h3>
               <div className="text-xs sm:text-sm text-gray-600 font-medium bg-white/70 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                 {module113Data.timestamp ? new Date(module113Data.timestamp).toLocaleTimeString() : 'N/A'}
                 <span className="ml-1 sm:ml-2 text-xs text-gray-500">(113)</span>
               </div>
             </div>
            
                         {/* Temperature */}
             <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-100/80 to-orange-100/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
               <div className="flex items-center">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                   <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                 </div>
                 <div>
                   <div className="text-xs sm:text-sm text-gray-600 font-medium">Temperature</div>
                   <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                     {module113Data.temperature?.toFixed(1)}°F
                   </div>
                 </div>
               </div>
             </div>

                                                   {/* Humidity */}
              {module113Data.humidity ? (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600">Humidity</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {module113Data.humidity.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Humidity</div>
                      <div className="text-xs sm:text-sm text-gray-400">Sensor not available</div>
                    </div>
                  </div>
                </div>
              )}

                          {/* Pressure */}
              {module113Data.pressure ? (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600">Pressure</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {module113Data.pressure.toFixed(1)} hPa
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Pressure</div>
                      <div className="text-xs sm:text-sm text-gray-400">Sensor not available</div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

                                   {/* Module 115 - Inside */}
          {module115Data && (
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                    <span className="text-white text-xs sm:text-sm font-bold">I</span>
                  </div>
                  Inside
                </h3>
                <div className="text-xs sm:text-sm text-gray-600 font-medium bg-white/70 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                  {module115Data.timestamp ? new Date(module115Data.timestamp).toLocaleTimeString() : 'N/A'}
                  <span className="ml-1 sm:ml-2 text-xs text-gray-500">(115)</span>
                </div>
              </div>
             
             {/* Temperature */}
             <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
               <div className="flex items-center">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                   <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                 </div>
                 <div>
                   <div className="text-xs sm:text-sm text-gray-600 font-medium">Temperature</div>
                   <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                     {module115Data.temperature?.toFixed(1)}°F
                   </div>
                 </div>
               </div>
             </div>

                          {/* Humidity */}
              {module115Data.humidity ? (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600">Humidity</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {module115Data.humidity.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Humidity</div>
                      <div className="text-xs sm:text-sm text-gray-400">Sensor not available</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pressure */}
              {module115Data.pressure ? (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600">Pressure</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {module115Data.pressure.toFixed(1)} hPa
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl mt-2 sm:mt-3">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Pressure</div>
                      <div className="text-xs sm:text-sm text-gray-400">Sensor not available</div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* No data message */}
        {!module113Data && !module115Data && (
          <div className="text-center py-8 text-gray-500">
            <Thermometer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempPanel;
