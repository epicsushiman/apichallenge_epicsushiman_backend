import { Router } from 'express';
import fetch from 'node-fetch';
import getAppAccessToken from '../spotifyAuth.js';

const router = Router();
const API = 'https://api.spotify.com/v1';

/* helper: run a playlist search and return the top hit (or null) */
async function searchTopPlaylist (query, token, market = 'US') {
  const url =
    `${API}/search?q=${encodeURIComponent(query)}` +
    `&type=playlist&limit=1&market=${market}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = await res.json();
  return json.playlists.items[0] ?? null;
}

router.get('/playlist', async (req, res) => {
  const weather = (req.query.weather || '').trim().toLowerCase();
  if (!weather) return res.status(400).json({ error: 'weather query missing' });

  try {
    const token   = await getAppAccessToken();
    const queries = [`${weather} vibes`, 'lofi chill'];  // simple fallback list

    let playlist = null;
    for (const q of queries) {
      playlist = await searchTopPlaylist(q, token);
      if (playlist) break;
    }
    if (!playlist) throw new Error('No matching playlist');

    res.json({
      id:    playlist.id,
      name:  playlist.name,
      url:   playlist.external_urls.spotify,
      cover: playlist.images?.[0]?.url ?? null,
      description: playlist.description
    });
  } catch (err) {
    console.error('spotify search error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
