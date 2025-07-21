// backend/spotifyAuth.js
import fetch from 'node-fetch';

/*  ▸ Cached app-only token  
    We request Client-Credentials flow once and refresh it 60 s before expiry. */
let cached = { value: null,            // the Bearer token
               expiresAt: 0 };         // ms-epoch

export async function getAppToken () {
  if (cached.value && Date.now() < cached.expiresAt - 60_000) {
    return cached.value;               // still valid
  }

  const id  = process.env.SPOTIFY_CLIENT_ID;
  const sec = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !sec) throw new Error('Missing Spotify env vars');

  const creds = Buffer.from(`${id}:${sec}`).toString('base64');

  const rsp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!rsp.ok) {
    const t = await rsp.text();
    throw new Error(`Spotify auth ${rsp.status}: ${t.slice(0, 120)}`);
  }

  const { access_token, expires_in } = await rsp.json();

  cached = {
    value:     access_token,
    expiresAt: Date.now() + expires_in * 1000
  };
  return access_token;
}
