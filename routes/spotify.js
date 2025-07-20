import express from 'express';
import fetch from 'node-fetch';
import getAppAccessToken from '../spotifyAuth.js';   // ← your helper

const router = express.Router();
const API = 'https://api.spotify.com/v1';

/* ───────── helpers ───────── */

function authHdr(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Return the best-matching public playlist for the given search string. */
async function searchTopPlaylist(query, token, market = 'US') {
  const url =
    `${API}/search?q=${encodeURIComponent(query)}&type=playlist&limit=1&market=${market}`;
  const res = await fetch(url, { headers: authHdr(token) });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = await res.json();
  return json.playlists.items[0] ?? null;
}

/* ───────── route ───────── */

router.get('/playlist', async (req, res) => {
  const weather = (req.query.weather || '').trim().toLowerCase();
  if (!weather) return res.status(400).json({ error: 'weather query missing' });

  try {
    const token = await getAppAccessToken();

    // primary query + very simple fallback
    const queries = [`${weather} vibes`, 'lofi chill'];
    let playlist = null;
    for (const q of queries) {
      playlist = await searchTopPlaylist(q, token);
      if (playlist) break;
    }
    if (!playlist) throw new Error('No matching playlist');

    res.json({
      id: playlist.id,
      name: playlist.name,
      url: playlist.external_urls.spotify,
      description: playlist.description,
      cover: playlist.images?.[0]?.url ?? null
      // no tracks – editorial tracks endpoint is blocked for dev apps
    });
  } catch (err) {
    console.error('spotify search error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
