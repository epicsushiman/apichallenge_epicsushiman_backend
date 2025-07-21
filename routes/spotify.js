// backend/routes/spotify.js
import { Router } from 'express';
import fetch from 'node-fetch';
import { getAppToken } from '../spotifyAuth.js';

const router = Router();

function mood(desc = '') {
  const d = desc.toLowerCase();
  
  // More comprehensive weather matching
  if (d.includes('clear') || d.includes('sunny')) return 'feel-good summer';
  if (d.includes('cloud') || d.includes('overcast')) return 'lofi chill';
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return 'rainy day';
  if (d.includes('snow') || d.includes('blizzard')) return 'cozy winter';
  if (d.includes('storm') || d.includes('thunder') || d.includes('lightning')) return 'dark ambient';
  if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return 'ambient calm';
  if (d.includes('wind') || d.includes('breezy')) return 'upbeat indie';
  
  // Default fallback
  return 'chill vibes';
}

router.get('/playlist', async (req, res) => {
  try {
    const weatherDesc = req.query.weather || '';
    const searchQuery = mood(weatherDesc);
    
    console.log(`Weather: "${weatherDesc}" -> Mood: "${searchQuery}"`);
    
    // Get Spotify token
    const token = await getAppToken();
    console.log('Successfully obtained Spotify token');
    
    // Search for playlists
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=playlist&limit=20`;
    console.log('Searching Spotify with URL:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify API error:', response.status, errorText);
      throw new Error(`Spotify API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Spotify search results:', {
      total: data.playlists?.total || 0,
      items: data.playlists?.items?.length || 0
    });

    const items = data.playlists?.items ?? [];
    if (!items.length) {
      console.log('No playlists found, trying fallback search');
      
      // Try a more generic search as fallback
      const fallbackResponse = await fetch(
        `https://api.spotify.com/v1/search?q=chill&type=playlist&limit=10`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackItems = fallbackData.playlists?.items ?? [];
        if (fallbackItems.length > 0) {
          const playlist = fallbackItems[0];
          return res.json({
            name: playlist.name,
            url: playlist.external_urls?.spotify || '#',
            description: playlist.description || 'A chill playlist for any mood'
          });
        }
      }
      
      return res.status(404).json({ error: 'No matching playlists found' });
    }

    // Find a playlist with tracks, or use the first one
    const playlist = items.find(p => p.tracks?.total > 0) || items[0];
    
    if (!playlist?.external_urls?.spotify) {
      console.error('Playlist found but no Spotify URL available');
      return res.status(404).json({ error: 'No playable playlist found' });
    }

    console.log('Successfully found playlist:', playlist.name);

    res.json({
      name: playlist.name,
      url: playlist.external_urls.spotify,
      description: playlist.description || `Perfect playlist for ${weatherDesc} weather`
    });

  } catch (err) {
    console.error('[Spotify playlist error]', {
      message: err.message,
      stack: err.stack,
      weather: req.query.weather
    });
    
    // Return more specific error messages
    if (err.message.includes('Missing Spotify env vars')) {
      res.status(500).json({ error: 'Spotify API not configured properly' });
    } else if (err.message.includes('Spotify auth')) {
      res.status(500).json({ error: 'Spotify authentication failed' });
    } else {
      res.status(500).json({ error: 'Failed to fetch playlist - please try again' });
    }
  }
});

export default router;