import express from 'express';
import fetch   from 'node-fetch';
const router = express.Router();

/* 1️⃣  /coords MUST come **before** /:city so it isn't
       swallowed by the dynamic "city" param */
router.get('/coords', async (req, res, next) => {
  const { lat, lon } = req.query;
  console.log('📍 Coords request:', { lat, lon });
  
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat/lon parameters' });
  }

  if (!process.env.PW_KEY) {
    console.error('❌ Missing PW_KEY environment variable');
    return res.status(500).json({ error: 'Weather API key not configured' });
  }

  try {
    const url = `https://api.pirateweather.net/forecast/${process.env.PW_KEY}/${lat},${lon}?units=si`;
    console.log('🌤️  Fetching weather:', url.replace(process.env.PW_KEY, 'HIDDEN'));
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pirate Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = normalise(data);
    console.log('✅ Weather data:', result);
    res.json(result);
  } catch (err) { 
    console.error('❌ Weather coords error:', err);
    next(err); 
  }
});

router.get('/:city', async (req, res, next) => {
  console.log('🏙️  City request:', req.params.city);
  
  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(req.params.city)}&count=1`;
    console.log('🗺️  Geocoding:', geocodeUrl);
    
    const geoResponse = await fetch(geocodeUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geocoding API error: ${geoResponse.status}`);
    }
    
    const geo = await geoResponse.json();
    console.log('🗺️  Geocoding result:', geo);

    if (!geo.results?.length) {
      return res.status(404).json({ error: 'City not found' });
    }

    const { latitude, longitude, name, country } = geo.results[0];
    console.log('📍 Found coordinates:', { latitude, longitude, name, country });

    if (!process.env.PW_KEY) {
      console.error('❌ Missing PW_KEY environment variable');
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const pwUrl = `https://api.pirateweather.net/forecast/${process.env.PW_KEY}/${latitude},${longitude}?units=si`;
    console.log('🌤️  Fetching weather:', pwUrl.replace(process.env.PW_KEY, 'HIDDEN'));
    
    const wxResponse = await fetch(pwUrl);
    if (!wxResponse.ok) {
      throw new Error(`Pirate Weather API error: ${wxResponse.status}`);
    }
    
    const wx = await wxResponse.json();
    const result = normalise(wx, `${name}, ${country}`);
    console.log('✅ Weather data:', result);
    res.json(result);
  } catch (err) { 
    console.error('❌ Weather city error:', err);
    next(err); 
  }
});

// Add error handler
router.use((err, req, res, next) => {
  console.error('Weather route error:', err);
  res.status(500).json({ 
    error: err.message || 'Weather service error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default router;

/* helper: shape the response exactly the way your React code expects */
function normalise(wx, city = '') {
  const icon = wx.currently?.icon ?? 'clear';
  return {
    city,
    description: icon.replace(/-/g, ' '),
    temp: Math.round(wx.currently?.temperature ?? 0),
  };
}