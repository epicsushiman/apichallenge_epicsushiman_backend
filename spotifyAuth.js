import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

let cache = null;

export default async function getAppAccessToken () {
  if (cache && cache.expires_at > Date.now()) return cache.access_token;

  const auth64 = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth64}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`token request failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  cache = {
    access_token: data.access_token,
    expires_at:   Date.now() + (data.expires_in - 60) * 1000
  };

  console.log('✅ Successfully obtained Spotify access token');
  return cache.access_token;
}
