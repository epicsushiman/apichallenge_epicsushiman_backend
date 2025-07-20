import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import weatherRouter from './routes/weather.js';
import spotifyRouter from './routes/spotify.js';

const app   = express();
const PORT  = process.env.PORT || 3000;

app.use(cors());
app.use('/api/weather',  weatherRouter);
app.use('/api/spotify',  spotifyRouter);

// health check so Render’s first probe gets 200
app.get('/api', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🚀  Server running on ${PORT}`));
