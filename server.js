// server.js - Backend for Roblox OAuth
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Your Roblox OAuth credentials from https://create.roblox.com/credentials
const ROBLOX_CONFIG = {
    clientId: process.env.ROBLOX_CLIENT_ID,
    clientSecret: process.env.ROBLOX_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/callback'
};

// Step 1: Redirect to Roblox OAuth
app.get('/auth/roblox', (req, res) => {
    const { state, redirect_uri } = req.query;
    
    const authUrl = new URL('https://apis.roblox.com/oauth/v1/authorize');
    authUrl.searchParams.append('client_id', ROBLOX_CONFIG.clientId);
    authUrl.searchParams.append('redirect_uri', redirect_uri || ROBLOX_CONFIG.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile');
    authUrl.searchParams.append('state', state);
    
    res.redirect(authUrl.toString());
});

// Step 2: Handle callback and exchange code for tokens
app.post('/auth/token', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', 
            new URLSearchParams({
                client_id: ROBLOX_CONFIG.clientId,
                client_secret: ROBLOX_CONFIG.clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri || ROBLOX_CONFIG.redirectUri
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        res.json({
            access_token: tokenResponse.data.access_token,
            token_type: tokenResponse.data.token_type,
            expires_in: tokenResponse.data.expires_in
        });
        
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange authorization code' });
    }
});

// Serve static files (your frontend)
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`OAuth redirect URI: ${ROBLOX_CONFIG.redirectUri}`);
});
