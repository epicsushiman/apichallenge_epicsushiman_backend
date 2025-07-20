import express from 'express';
import fetch   from 'node-fetch';
const router = express.Router();

/* 1️⃣  /coords MUST come **before** /:city so it isn’t
       swallowed by the dynamic “city” param */
router.get('/coords', async (req, res, next) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon'});
  try {
    const url = `https://api.pirateweather.net/forecast/${process.env.PW_KEY}/${lat},${lon}?units=si`;
    const data = await fetch(url).then(r => r.json());
    res.json(normalise(data));
  } catch (err) { next(err); }
});

router.get('/:city', async (req, res, next) => {
  try {
    const geo  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(req.params.city)}&count=1`
    ).then(r => r.json());

    if (!geo.results?.length) return res.status(404).json({ error: 'city not found' });

    const { latitude, longitude, name, country } = geo.results[0];
    const pwUrl = `https://api.pirateweather.net/forecast/${process.env.PW_KEY}/${latitude},${longitude}?units=si`;
    const wx    = await fetch(pwUrl).then(r => r.json());
    res.json(normalise(wx, `${name}, ${country}`));
  } catch (err) { next(err); }
});

export default router;

/* helper: shape the response exactly the way your React code expects */
function normalise(wx, city = '') {
  const icon = wx.currently.icon ?? 'clear';
  return {
    city,
    description: icon.replace(/-/g, ' '),
    temp:        Math.round(wx.currently.temperature),
  };
}
