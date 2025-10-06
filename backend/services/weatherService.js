import axios from "axios";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

/**
 * Get current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Current weather data
 */
export async function getCurrentWeather(lat, lng) {
  if (!OPENWEATHER_API_KEY) {
    console.warn("⚠️ OpenWeather API key not configured");
    return {
      temp: 0,
      condition: "Unknown",
      humidity: 0,
      windSpeed: 0,
    };
  }

  try {
    const response = await axios.get(`${WEATHER_API_BASE}/weather`, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: "imperial", // Fahrenheit
      },
    });

    const data = response.data;

    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0]?.main || "Unknown",
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
    };
  } catch (error) {
    console.error("Error fetching current weather:", error.message);
    return {
      temp: 0,
      condition: "Unknown",
      humidity: 0,
      windSpeed: 0,
    };
  }
}

/**
 * Get 7-day weather forecast
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Array of forecast data
 */
export async function getWeatherForecast(lat, lng) {
  if (!OPENWEATHER_API_KEY) {
    console.warn("⚠️ OpenWeather API key not configured");
    return [];
  }

  try {
    const response = await axios.get(`${WEATHER_API_BASE}/forecast`, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: "imperial", // Fahrenheit
        cnt: 40, // 5 days * 8 (3-hour intervals)
      },
    });

    const data = response.data;

    // Group by day and calculate daily min/max
    const dailyForecasts = {};

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: date,
          temps: [],
          conditions: [],
          precipitation: 0,
        };
      }

      dailyForecasts[dateKey].temps.push(item.main.temp);
      dailyForecasts[dateKey].conditions.push(item.weather[0]?.main || "");
      dailyForecasts[dateKey].precipitation += item.pop || 0; // Probability of precipitation
    });

    // Convert to array and calculate averages
    const forecast = Object.values(dailyForecasts).map((day) => {
      const temps = day.temps;
      return {
        date: day.date,
        temp: {
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
        },
        condition: day.conditions[0] || "Unknown", // Use first condition
        precipitation: Math.round(
          (day.precipitation / day.conditions.length) * 100
        ), // Average %
      };
    });

    return forecast.slice(0, 7); // Return 7 days
  } catch (error) {
    console.error("Error fetching weather forecast:", error.message);
    return [];
  }
}

/**
 * Analyze historical weather patterns and determine best filming months
 * This is a simplified heuristic based on current/forecast data
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array<string>>} Array of best months (e.g., ["April", "May", "September"])
 */
export async function getBestFilmingMonths(lat, lng) {
  // This is a simplified implementation
  // In a production app, you'd use historical weather data or climatology APIs

  // General heuristics based on latitude
  const absLat = Math.abs(lat);

  if (absLat < 23.5) {
    // Tropical zones - dry seasons are best
    return ["December", "January", "February", "March"];
  } else if (absLat < 35) {
    // Subtropical zones - spring and fall
    return ["March", "April", "May", "September", "October"];
  } else if (absLat < 50) {
    // Temperate zones - late spring, summer, early fall
    return ["May", "June", "July", "August", "September"];
  } else {
    // Cold zones - summer only
    return ["June", "July", "August"];
  }
}

/**
 * Fetch comprehensive weather data for location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Weather data object
 */
export async function fetchWeatherData(lat, lng) {
  try {
    console.log(`🌤️ Fetching weather data for (${lat}, ${lng})...`);

    const [current, forecast, bestMonths] = await Promise.all([
      getCurrentWeather(lat, lng),
      getWeatherForecast(lat, lng),
      getBestFilmingMonths(lat, lng),
    ]);

    return {
      current: current,
      forecast: forecast,
      bestMonths: bestMonths,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    return {
      current: {
        temp: 0,
        condition: "Unknown",
        humidity: 0,
        windSpeed: 0,
      },
      forecast: [],
      bestMonths: [],
    };
  }
}
