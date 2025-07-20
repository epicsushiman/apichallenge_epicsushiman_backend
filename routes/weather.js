import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY  = process.env.WEATHER_API_KEY;           // set this in .env
const API_BASE = 'https://api.pirateweather.net/forecast';

/** basic “city name → lat/lon” helper using OpenStreetMap / Nominatim */
async function geocode(city) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(city)}&format=json&limit=1`
  );
  if (!res.ok) throw new Error('geocoding failed');
  const [row] = await res.json();
  if (!row) throw new Error('city not found');
  return { lat: row.lat, lon: row.lon };
}

router.get('/:city', async (req, res) => {
  try {
    const { lat, lon } = await geocode(req.params.city);

    const url   = `${API_BASE}/${API_KEY}/${lat},${lon}?units=metric`;
    const wRes  = await fetch(url);
    if (!wRes.ok) throw new Error('weather fetch failed');
    const json  = await wRes.json();
    const curr  = json.currently || json;

    res.json({
      description: curr.summary.toLowerCase(),
      temp: curr.temperature
    });
  } catch (err) {
    console.error('weather error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
