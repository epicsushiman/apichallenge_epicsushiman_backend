// weather.js  (ES Modules)
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;   // <- add to .env
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Call OpenWeatherMap by city name and return a minimal, frontend-friendly
 * payload.
 */
export async function byCity(city) {
  const url =
    `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_KEY}`;
  return fetchWeather(url);
}

/**
 * Same, but for latitude / longitude (keeps the existing /coords route
 * in your API).
 */
export async function byCoords(lat, lon) {
  const url =
    `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  return fetchWeather(url);
}

/* ───────────────── helpers ───────────────── */

async function fetchWeather(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message || 'OpenWeather request failed');
  }

  const data = await res.json();
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    description: data.weather[0].description, // e.g. “light rain”
  };
}
