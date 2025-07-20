import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import weatherRoutes from './routes/weather.js';
import spotifyRoutes from './routes/spotify.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/weather', weatherRoutes);
app.use('/api/spotify', spotifyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  Server running on port ${PORT}`);
});
