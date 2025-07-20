const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

const { PIRATEWEATHER_API_KEY } = process.env;
const NOMINATIM_HEADERS = {
  'User-Agent': 'TravelMoodPlaylistApp/1.0 (contact@example.com)'
};

/* GET /api/weather/coords?lat=<>&lon=<> */
router.get('/coords', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });
  
    try {
      const pwUrl = `https://api.pirateweather.net/forecast/${PIRATEWEATHER_API_KEY}/${lat},${lon}?units=si`;
      const pwResp = await fetch(pwUrl);
  
      if (!pwResp.ok) {
        const body = await pwResp.text();
        console.error('PirateWeather error', pwResp.status, body);
        return res.status(pwResp.status).json({ error: 'PirateWeather request failed', details: body });
      }
  
      const { timezone, currently } = await pwResp.json();
      res.json({
        city: timezone || 'Current location',
        temp: currently.temperature,
        description: currently.summary
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// GET /api/weather/<city>
router.get('/:city', async (req, res) => {
  try {
    const city = req.params.city.trim();

    // 1️⃣ Geocode city name → lat/lon
    const geoResp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!geoResp.ok) return res.status(500).json({ error: 'Failed to geocode city' });

    const [geo] = await geoResp.json();
    if (!geo) return res.status(404).json({ error: 'City not found' });

    const { lat, lon, display_name } = geo;

    // 2️⃣ Pirate Weather forecast
    const pwUrl = `https://api.pirateweather.net/forecast/${PIRATEWEATHER_API_KEY}/${lat},${lon}?units=si`;
    const pwResp = await fetch(pwUrl);

    if (!pwResp.ok) {
      // grab the raw body so we can see why
      const body = await pwResp.text();
      console.error('PirateWeather error', pwResp.status, body);
      return res
        .status(pwResp.status)
        .json({ error: 'PirateWeather request failed', details: body });
    }

    const { currently } = await pwResp.json();

    res.json({
      city        : display_name,
      temperature : currently.temperature,
      description : currently.summary.toLowerCase()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;