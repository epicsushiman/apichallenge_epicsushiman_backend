// weather.js  (ES Modules)
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Call OpenWeatherMap by city name and return a minimal, frontend-friendly
 * payload.
 */
export async function byCity(city) {
  if (!OPENWEATHER_KEY) {
    throw new Error('OpenWeather API key is not configured');
  }
  
  const url =
    `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_KEY}`;
  return fetchWeather(url);
}

/**
 * Same, but for latitude / longitude (keeps the existing /coords route
 * in your API).
 */
export async function byCoords(lat, lon) {
  if (!OPENWEATHER_KEY) {
    throw new Error('OpenWeather API key is not configured');
  }
  
  const url =
    `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  return fetchWeather(url);
}

/* ───────────────── helpers ───────────────── */

async function fetchWeather(url) {
  console.log('Fetching weather from:', url.replace(OPENWEATHER_KEY, '[API_KEY_HIDDEN]'));
  
  const res = await fetch(url);
  
  if (!res.ok) {
    let errorMessage = 'OpenWeather request failed';
    
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (jsonError) {
      // If we can't parse the error as JSON, use the status
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    
    console.error('Weather API error:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await res.json();
  
  // Log successful response for debugging
  console.log('Weather data received for:', data.name);
  
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    description: data.weather[0].description, // e.g. "light rain"
  };
}