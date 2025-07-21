import express from 'express';
import cors    from 'cors';
import 'dotenv/config';

import { byCity, byCoords } from './routes/weather.js'; 

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());


app.get('/api/weather/coords', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon query params required' });

  try {
    res.json(await byCoords(lat, lon));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/weather/:city', async (req, res) => {
  try {
    res.json(await byCity(req.params.city));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

import spotifyRouter from './routes/spotify.js';
app.use('/api/spotify', spotifyRouter);

app.get('/api', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🚀  server on ${PORT}`));
