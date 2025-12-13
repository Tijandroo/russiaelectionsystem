// server.js - Node.js backend for OAuth (Required for production)
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Your Roblox OAuth credentials from https://create.roblox.com/credentials
const ROBLOX_CONFIG = {
    clientId: process.env.ROBLOX_CLIENT_ID || "3289521937941844029",
    clientSecret: process.env.ROBLOX_CLIENT_SECRET || "78ISFYmQHUiIRvzXpSG6KC8uUlPDFYq0_3zCRiXclMSguR_5OnGAKSToft0Wpjt_",
    redirectUri: process.env.ROBLOX_REDIRECT_URI || "http://localhost:3000/oauth/callback"
};

// OAuth callback endpoint (for production - handles token exchange securely)
app.get('/oauth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.status(400).send('Authorization code missing');
        }
        
        // Exchange code for tokens
        const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', new URLSearchParams({
            client_id: ROBLOX_CONFIG.clientId,
            client_secret: ROBLOX_CONFIG.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: ROBLOX_CONFIG.redirectUri
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token, id_token } = tokenResponse.data;
        
        // Get user info
        const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        const userInfo = userResponse.data;
        
        // Redirect back to frontend with user info
        const redirectUrl = new URL('/index.html', `http://${req.headers.host}`);
        redirectUrl.searchParams.set('oauth_success', 'true');
        redirectUrl.searchParams.set('user_id', userInfo.sub);
        redirectUrl.searchParams.set('username', userInfo.preferred_username);
        redirectUrl.searchParams.set('access_token', access_token);
        
        res.redirect(redirectUrl.toString());
        
    } catch (error) {
        console.error('OAuth callback error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed');
    }
});

// Serve main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to set up your Roblox OAuth app at: https://create.roblox.com/credentials');
});