export const convertWeatherToAlert = (weatherData) => {
    return {
      type: 'weather',
      coordinates: [weatherData.coord.lat, weatherData.coord.lon],
      location: weatherData.name,
      severity: getSeverityFromWeather(weatherData),
      description: weatherData.weather[0].description,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed
    };
  };
  
  function getSeverityFromWeather(weatherData) {
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    
    if (temp > 40 || temp < 0 || windSpeed > 20) {
      return 'HIGH';
    } else if (temp > 35 || temp < 5 || windSpeed > 15) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }