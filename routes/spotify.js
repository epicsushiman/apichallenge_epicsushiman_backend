// routes/spotify.js
import { Router } from 'express';
import fetch from 'node-fetch';
import { getAppToken } from '../spotifyAuth.js';

const router = Router();

/* ─────────────── helpers ─────────────── */

/** Map raw OpenWeather description → friendlier Spotify search keyword. */
function moodFromWeather(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('clear'))   return 'feel-good summer';
  if (d.includes('cloud'))   return 'lofi chill';
  if (d.includes('rain'))    return 'rainy day';
  if (d.includes('snow'))    return 'cozy winter';
  if (d.includes('storm'))   return 'dark ambient';
  if (d.includes('mist') ||
      d.includes('fog'))     return 'ambient calm';
  return 'relax';
}

/* ─────────────── route ───────────────
   GET /api/spotify/playlist?weather=<desc>
*/
router.get('/playlist', async (req, res) => {
  try {
    const rawDesc = req.query.weather || '';
    const keyword = moodFromWeather(rawDesc);
    const query   = encodeURIComponent(keyword);

    const token = await getAppToken();
    const url   =
      `https://api.spotify.com/v1/search?q=${query}&type=playlist&limit=10`;

    const rsp   = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!rsp.ok) {
      const msg = await rsp.text();
      throw new Error(`Spotify ${rsp.status}: ${msg.slice(0, 200)}`);
    }

    const data  = await rsp.json();
    const items = data.playlists?.items ?? [];

    if (!items.length) {
      return res.status(404).json({ error: 'No matching playlist' });
    }

    // pick the first playlist that actually has tracks
    const playlist = items.find(p => p.tracks?.total > 0) || items[0];

    return res.json({
      name:        playlist.name,
      url:         playlist.external_urls.spotify,
      description: playlist.description
    });
  } catch (err) {
    console.error('[spotify]', err.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

export default router;
