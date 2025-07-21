import fetch from 'node-fetch';


let cached = { 
  value: null,            
  expiresAt: 0            
};

export async function getAppToken() {
  if (cached.value && Date.now() < cached.expiresAt - 60_000) {
    console.log('Using cached Spotify token');
    return cached.value;
  }

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  
  console.log('Spotify credentials check:', {
    hasClientId: !!id,
    hasClientSecret: !!secret,
    clientIdLength: id ? id.length : 0
  });
  
  if (!id || !secret) {
    throw new Error('Missing Spotify env vars: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required');
  }

  const credentials = Buffer.from(`${id}:${secret}`).toString('base64');

  console.log('Requesting new Spotify token...');
  
  try {
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
      console.error('Spotify auth failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Spotify auth ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      throw new Error('No access token received from Spotify');
    }

    cached = {
      value: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    };
    
    console.log('Successfully obtained Spotify token, expires in:', tokenData.expires_in, 'seconds');
    return tokenData.access_token;

  } catch (error) {
    console.error('Error getting Spotify token:', error);
    
    cached = { value: null, expiresAt: 0 };
    
    throw error;
  }
}