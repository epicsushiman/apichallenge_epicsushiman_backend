const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

// Try to import the auth function, with better error handling
let getSpotifyToken;
try {
    const spotifyAuth = require('../utils/spotifyAuth');
    getSpotifyToken = spotifyAuth.getSpotifyToken;
} catch (error) {
    console.error('❌ Failed to load Spotify auth module:', error.message);
    console.error('Make sure you have created utils/spotifyAuth.js');
}

// Updated playlist mapping with more reliable Spotify playlists
// These use Spotify's official curated playlists that are more stable
const playlistByWeather = {
    /* clear-sky vibes - upbeat, sunny music */
    clear:       '37i9dQZF1DX0XUsuxWHRQd',  // Good Vibes
    sunny:       '37i9dQZF1DX0XUsuxWHRQd',  // Good Vibes
    breezy:      '37i9dQZF1DX0XUsuxWHRQd',  // Good Vibes
    
    /* clouds / overcast - chill, mellow */
    clouds:      '37i9dQZF1DX4WYpdgoIcn6',  // Chill Hits
    overcast:    '37i9dQZF1DX4WYpdgoIcn6',  // Chill Hits
    mostly:      '37i9dQZF1DX4WYpdgoIcn6',  // Chill Hits
    partly:      '37i9dQZF1DX4WYpdgoIcn6',  // Chill Hits (for "partly cloudy")
    
    /* rain - acoustic, cozy */
    rain:        '37i9dQZF1DWZqd5JICZI0u',  // Acoustic Covers
    drizzle:     '37i9dQZF1DWZqd5JICZI0u',  // Acoustic Covers
    
    /* thunderstorm - intense, dramatic */
    thunder:     '37i9dQZF1DXdxcBWuJkbcy',  // Power Workout
    storm:       '37i9dQZF1DXdxcBWuJkbcy',  // Power Workout
    
    /* snow / cold - cozy, winter vibes */
    snow:        '37i9dQZF1DX4E3UdUs7fUx',  // Cozy Folk
    cold:        '37i9dQZF1DX4E3UdUs7fUx',  // Cozy Folk
    
    /* fog / mist - ambient, dreamy */
    fog:         '37i9dQZF1DWWQRwui0ExPn',  // Lofi Hip Hop
    mist:        '37i9dQZF1DWWQRwui0ExPn',  // Lofi Hip Hop
    
    /* default fallback */
    default:     '37i9dQZF1DXcBWIGoYBM5M'   // Today's Top Hits
};

// Alternative fallback playlists in case primary ones fail
const fallbackPlaylists = {
    upbeat:      '37i9dQZF1DXdPec7aLTmlC',  // Happy Hits!
    chill:       '37i9dQZF1DX4sWSpwAYIy1',  // Peaceful Piano
    default:     '37i9dQZF1DXcBWIGoYBM5M'   // Today's Top Hits
};

function selectPlaylistId(weatherDesc) {
    const desc = weatherDesc.toLowerCase();
    console.log(`🔍 Selecting playlist for weather: "${desc}"`);
    
    // Find matching weather condition
    const key = Object.keys(playlistByWeather).find(k => desc.includes(k));
    
    if (key && key !== 'default') {
        console.log(`✅ Found match: "${key}" -> ${playlistByWeather[key]}`);
        return playlistByWeather[key];
    }
    
    // Fallback logic based on general mood
    if (desc.includes('sun') || desc.includes('clear') || desc.includes('bright')) {
        console.log(`☀️ Using sunny fallback`);
        return playlistByWeather.sunny;
    } else if (desc.includes('rain') || desc.includes('wet') || desc.includes('drizzle')) {
        console.log(`🌧️ Using rain fallback`);
        return playlistByWeather.rain;
    } else if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('grey')) {
        console.log(`☁️ Using clouds fallback`);
        return playlistByWeather.clouds;
    } else if (desc.includes('snow') || desc.includes('cold') || desc.includes('freeze')) {
        console.log(`❄️ Using snow fallback`);
        return playlistByWeather.snow;
    } else if (desc.includes('storm') || desc.includes('thunder')) {
        console.log(`⛈️ Using storm fallback`);
        return playlistByWeather.thunder;
    } else if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) {
        console.log(`🌫️ Using fog fallback`);
        return playlistByWeather.fog;
    }
    
    // Ultimate fallback
    console.log(`🎵 Using default fallback`);
    return playlistByWeather.default;
}

async function fetchPlaylistWithFallback(token, playlistId, weatherDesc) {
    try {
        console.log(`🎵 Fetching playlist: ${playlistId}`);
        const spRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (spRes.ok) {
            console.log(`✅ Successfully fetched playlist: ${playlistId}`);
            return await spRes.json();
        }
        
        // If primary playlist fails, try fallbacks
        console.log(`❌ Primary playlist ${playlistId} failed with status ${spRes.status}`);
        const errorBody = await spRes.text();
        console.log(`Error details:`, errorBody);
        
        // Try a mood-based fallback
        let fallbackId;
        if (weatherDesc.includes('rain') || weatherDesc.includes('cloud')) {
            fallbackId = fallbackPlaylists.chill;
        } else {
            fallbackId = fallbackPlaylists.upbeat;
        }
        
        console.log(`🔄 Trying fallback playlist: ${fallbackId}`);
        const fallbackRes = await fetch(`https://api.spotify.com/v1/playlists/${fallbackId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (fallbackRes.ok) {
            console.log(`✅ Using fallback playlist ${fallbackId}`);
            return await fallbackRes.json();
        }
        
        // Last resort - use default
        console.log(`🔄 Trying default playlist: ${fallbackPlaylists.default}`);
        const defaultRes = await fetch(`https://api.spotify.com/v1/playlists/${fallbackPlaylists.default}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (defaultRes.ok) {
            console.log(`✅ Using default playlist ${fallbackPlaylists.default}`);
            return await defaultRes.json();
        }
        
        const defaultError = await defaultRes.text();
        throw new Error(`All playlist requests failed. Last status: ${defaultRes.status}, Error: ${defaultError}`);
        
    } catch (error) {
        console.error('❌ Playlist fetch error:', error);
        throw error;
    }
}

// GET /api/spotify/playlist?weather=<description>
router.get('/playlist', async (req, res) => {
    const weatherDesc = (req.query.weather || '').toLowerCase();
    
    console.log(`\n🎵 === SPOTIFY PLAYLIST REQUEST ===`);
    console.log(`Weather description: "${weatherDesc}"`);
    console.log(`Client ID available: ${!!process.env.SPOTIFY_CLIENT_ID}`);
    console.log(`Client Secret available: ${!!process.env.SPOTIFY_CLIENT_SECRET}`);
    console.log(`Auth function loaded: ${!!getSpotifyToken}`);
    
    // Check if auth module loaded
    if (!getSpotifyToken) {
        console.error('❌ Spotify auth module not loaded');
        return res.status(500).json({ 
            error: 'Spotify authentication not configured',
            details: 'Missing spotifyAuth module. Make sure utils/spotifyAuth.js exists.' 
        });
    }
    
    // Check credentials
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.error('❌ Missing Spotify credentials');
        return res.status(500).json({ 
            error: 'Spotify credentials not configured',
            details: 'Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment variables' 
        });
    }
    
    try {
        console.log('🔐 Getting Spotify token...');
        const token = await getSpotifyToken(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET
        );
        console.log('✅ Token obtained successfully');
        
        const playlistId = selectPlaylistId(weatherDesc);
        console.log(`🎯 Selected playlist ID: ${playlistId}`);
        
        const playlist = await fetchPlaylistWithFallback(token, playlistId, weatherDesc);
        
        // Format response
        const response = {
            name: playlist.name,
            description: playlist.description || `Perfect music for ${weatherDesc} weather`,
            url: playlist.external_urls.spotify,
            image: playlist.images?.[0]?.url || null,
            tracks: playlist.tracks.items.slice(0, 20).map(item => ({
                name: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                preview_url: item.track.preview_url,
                spotify_url: item.track.external_urls.spotify,
                duration_ms: item.track.duration_ms
            }))
        };
        
        console.log(`✅ Playlist response ready: "${response.name}" with ${response.tracks.length} tracks`);
        res.json(response);
        
    } catch (err) {
        console.error('❌ Spotify playlist error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch playlist',
            details: err.message 
        });
    }
});

// GET /api/spotify/categories - helpful for finding playlist IDs
router.get('/categories', async (req, res) => {
    try {
        const token = await getSpotifyToken(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET
        );
        
        const categoriesRes = await fetch('https://api.spotify.com/v1/browse/categories?limit=50', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!categoriesRes.ok) {
            throw new Error(`Categories fetch failed: ${categoriesRes.status}`);
        }
        
        const data = await categoriesRes.json();
        res.json(data.categories);
        
    } catch (err) {
        console.error('Categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Test endpoint to check Spotify connection
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Testing Spotify connection...');
        
        if (!getSpotifyToken) {
            throw new Error('Spotify auth module not loaded');
        }
        
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            throw new Error('Missing Spotify credentials');
        }
        
        const token = await getSpotifyToken(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET
        );
        
        // Test with a simple request
        const testRes = await fetch('https://api.spotify.com/v1/browse/categories?limit=1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!testRes.ok) {
            throw new Error(`Test request failed: ${testRes.status}`);
        }
        
        res.json({ 
            status: 'success', 
            message: 'Spotify connection working!',
            timestamp: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('❌ Spotify test failed:', err);
        res.status(500).json({ 
            status: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;