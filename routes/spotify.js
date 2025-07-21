// backend/routes/spotify.js
import { Router } from 'express';
import fetch from 'node-fetch';
import { getAppToken } from '../spotifyAuth.js';

const router = Router();

function mood(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('clear'))   return 'feel-good summer';
  if (d.includes('cloud'))   return 'lofi chill';
  if (d.includes('rain'))    return 'rainy day';
  if (d.includes('snow'))    return 'cozy winter';
  if (d.includes('storm'))   return 'dark ambient';
  if (d.includes('mist') || d.includes('fog'))
                            return 'ambient calm';
  return 'relax';
}

router.get('/playlist', async (req, res) => {
  try {
    const query = encodeURIComponent(mood(req.query.weather));
    const token = await getAppToken();

    const data = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=playlist&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(r => r.json());

    const items = data.playlists?.items ?? [];
    if (!items.length)
      return res.status(404).json({ error: 'No matching playlist' });

    // first playlist that actually has tracks
    const pl = items.find(p => p.tracks?.total > 0) || items[0];
    if (!pl?.external_urls?.spotify)
      return res.status(404).json({ error: 'No playable playlist' });

    res.json({
      name:  pl.name,
      url:   pl.external_urls.spotify,
      description: pl.description
    });
  } catch (err) {
    console.error('[spotify search error]', err.message);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

export default router;
