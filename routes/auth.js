const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// Discord OAuth2 configuration
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
const DISCORD_API = 'https://discord.com/api/v10';

/**
 * GET /auth/discord
 * Redirects to Discord OAuth2 authorization page
 */
router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds'
    });

    res.redirect(`${DISCORD_API}/oauth2/authorize?${params.toString()}`);
});

/**
 * GET /auth/discord/callback
 * Handles the callback from Discord OAuth2
 */
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        // Exchange code for access token
        const tokenParams = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
        });

        const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            body: tokenParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Error exchanging code for token:', error);
            return res.redirect('/?error=token_exchange');
        }

        const tokenData = await tokenResponse.json();
        
        // Get user information
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
            headers: {
                Authorization: `${tokenData.token_type} ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            const error = await userResponse.text();
            console.error('Error fetching user data:', error);
            return res.redirect('/?error=user_data');
        }

        const userData = await userResponse.json();

        // Store user data in session or handle as needed
        // For this example, we'll just redirect to the home page with a success message
        res.redirect('/?auth=success&user=' + userData.username);
        
    } catch (error) {
        console.error('Error in Discord OAuth callback:', error);
        res.redirect('/?error=server_error');
    }
});

module.exports = router;
