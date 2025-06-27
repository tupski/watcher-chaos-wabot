# Discord OAuth2 Setup Guide

This guide will help you set up Discord OAuth2 for your application, allowing users to log in with their Discord accounts.

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on "New Application" and give it a name
3. Fill in the basic information for your application

## Step 2: Configure OAuth2 Settings

1. In the left sidebar, click on "OAuth2"
2. Under "Redirects", click "Add Redirect"
3. Enter `http://localhost:3000/auth/discord/callback` as the redirect URL
4. Click "Save Changes"

![Discord OAuth2 Redirects](https://i.imgur.com/JYlNbfP.png)

## Step 3: Get Your Client ID and Client Secret

1. In the "OAuth2" section, you'll find your "Client ID" - copy this value
2. Click on "Reset Secret" to generate a new client secret (or copy the existing one if available)
3. Store these values securely - you'll need them for your application

![Discord OAuth2 Credentials](https://i.imgur.com/8HJyUJD.png)

## Step 4: Configure Your Application

1. Create or update your `.env` file with the following values:
   ```
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
   ```

2. Replace `your_client_id` and `your_client_secret` with the values you copied from the Discord Developer Portal

## Step 5: Generate an OAuth2 URL

If you want to create a custom login button or link, you can generate an OAuth2 URL:

1. In the Discord Developer Portal, go to the "OAuth2" section
2. Under "OAuth2 URL Generator", select the following scopes:
   - `identify` (to get the user's basic information)
   - `guilds` (to get the user's servers)
3. Copy the generated URL

You can use this URL directly, or you can use the built-in route in the application (`/auth/discord`).

## Step 6: Test the Integration

1. Start your application with `npm start`
2. Navigate to `http://localhost:3000`
3. Click the "Login with Discord" button
4. You should be redirected to Discord's authorization page
5. After authorizing, you should be redirected back to your application

## Troubleshooting

### Invalid Redirect URI

If you see an error like "Invalid OAuth2 redirect_uri", make sure:
- The redirect URI in your code exactly matches the one you added in the Discord Developer Portal
- You've saved the changes in the Discord Developer Portal after adding the redirect URI

### Invalid Client Secret

If you see an error related to the client secret, make sure:
- You've copied the client secret correctly
- You've reset the client secret if necessary

### CORS Issues

If you're experiencing CORS issues:
- Make sure your server is properly handling CORS
- Check that the redirect URI is on the same domain as your application

## Additional Resources

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Express.js Documentation](https://expressjs.com/)
- [OAuth2 Best Practices](https://oauth.net/2/best-practices/)
