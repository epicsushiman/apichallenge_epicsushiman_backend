import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { byCity, byCoords } from './weather.js';   // ⬅️ new helpers
import spotifyRouter from './routes/spotify.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ─────────────── Weather endpoints ───────────────
app.get('/api/weather/:city', async (req, res) => {
  try {
    const data = await byCity(req.params.city);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/weather/coords', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query params required' });
  }

  try {
    const data = await byCoords(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────── Spotify endpoints ───────────────
app.use('/api/spotify', spotifyRouter);

// health check so Render’s first probe gets 200
app.get('/api', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🚀  Server running on ${PORT}`));
