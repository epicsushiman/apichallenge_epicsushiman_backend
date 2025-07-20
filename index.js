require('dotenv').config();
const express = require('express');
const cors    = require('cors');          // ← new
const app     = express();

/* ① CORS middleware – must come FIRST */
app.use(cors({ origin: 'http://localhost:5173' }));   // dev URL of Vite
// app.use(cors());   // (if you’re okay with "*" in dev)

app.use(express.json());

/* existing routes */
app.use('/api/weather', require('./routes/weather'));
app.use('/api/spotify', require('./routes/spotify'));

/* basic health check (optional) */
app.get('/', (_, res) => res.send('Travel-Mood backend alive'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
