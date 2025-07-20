const fetch = require('node-fetch');

// Cache for storing the access token and expiration
let tokenCache = {
    access_token: null,
    expires_at: null
};

/**
 * Get a valid Spotify access token using Client Credentials flow
 * @param {string} clientId - Spotify Client ID
 * @param {string} clientSecret - Spotify Client Secret
 * @returns {Promise<string>} - Access token
 */
async function getSpotifyToken(clientId, clientSecret) {
    // Check if we have a valid cached token
    if (tokenCache.access_token && tokenCache.expires_at > Date.now()) {
        return tokenCache.access_token;
    }

    // Validate credentials
    if (!clientId || !clientSecret) {
        throw new Error('Spotify Client ID and Client Secret are required');
    }

    try {
        // Prepare credentials for Basic Auth
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Request new token from Spotify
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Spotify token request failed:', response.status, errorText);
            throw new Error(`Spotify authentication failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the token with expiration time (subtract 60 seconds for safety margin)
        tokenCache = {
            access_token: data.access_token,
            expires_at: Date.now() + ((data.expires_in - 60) * 1000)
        };

        console.log('✅ Successfully obtained Spotify access token');
        console.log('⚡ SPOTIFY_TOKEN →', data.access_token);
        return data.access_token;

    } catch (error) {
        console.error('Error getting Spotify token:', error);
        throw new Error(`Failed to authenticate with Spotify: ${error.message}`);
    }
}

/**
 * Clear the cached token (useful for testing or error recovery)
 */
function clearTokenCache() {
    tokenCache = {
        access_token: null,
        expires_at: null
    };
}

module.exports = {
    getSpotifyToken,
    clearTokenCache
};