// backend/routes/spotify.js
import { Router } from 'express';
import fetch from 'node-fetch';
import { getAppToken } from '../spotifyAuth.js';

const router = Router();

/* ───────── helper: weather-desc → mood keyword ───────── */
function moodFromWeather(desc = '') {
  const d = desc.toLowerCase();

  if (d.includes('clear'))       return 'feel-good summer';
  if (d.includes('cloud'))       return 'lofi chill';
  if (d.includes('rain'))        return 'rainy day';
  if (d.includes('snow'))        return 'cozy winter';
  if (d.includes('storm'))       return 'dark ambient';
  if (d.includes('mist') || d.includes('fog'))
                                return 'ambient calm';

  return 'relax';                // fallback
}

/* ───────── GET /api/spotify/playlist?weather=… ───────── */
router.get('/playlist', async (req, res) => {
  try {
    const rawDesc = req.query.weather || '';
    const keyword = moodFromWeather(rawDesc);         // mapped keyword
    const query   = encodeURIComponent(keyword);

    const token = await getAppToken();
    const url   = `https://api.spotify.com/v1/search?q=${query}&type=playlist&limit=10`;

    const rsp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!rsp.ok) throw new Error(`Spotify ${rsp.status}`);

    const data  = await rsp.json();
    const items = data.playlists?.items ?? [];

    // No playlist? try a generic fallback once
    if (!items.length && keyword !== 'relax') {
      const alt = await fetch(
        'https://api.spotify.com/v1/search?q=relax&type=playlist&limit=10',
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());
      items.push(...(alt.playlists?.items ?? []));
    }

    if (!items.length)
      return res.status(404).json({ error: 'No matching playlist' });

    // pick first playlist that actually has tracks, else first item
    const pl = items.find(p => p.tracks?.total) || items[0];

    res.json({
      name: pl.name,
      url:  pl.external_urls.spotify,
      description: pl.description
    });
  } catch (err) {
    console.error('[spotify search error]', err.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

export default router;
