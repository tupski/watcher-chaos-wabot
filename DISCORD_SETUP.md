# Discord Bot Setup Guide

This guide will help you set up your Discord bot with the correct permissions and intents to work with this application.

## Enabling Privileged Intents

If you want to use features that require access to message content (like the `!hell` command handler), you'll need to enable the `MESSAGE CONTENT` intent in the Discord Developer Portal.

### Steps to Enable Privileged Intents:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (bot)
3. Navigate to the "Bot" tab in the left sidebar
4. Scroll down to the "Privileged Gateway Intents" section
5. Enable the "MESSAGE CONTENT" intent by toggling the switch
6. Save your changes

![Discord Intents](https://i.imgur.com/HXJUzgP.png)

### Update Your Code

After enabling the intent in the Discord Developer Portal, you'll need to update your code to use the intent. Open `index.js` and modify the Discord client initialization:

```javascript
// initialize Discord clients
const discordClient = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
});
```

## Bot Permissions

When adding your bot to a server, make sure it has the following permissions:

- Read Messages/View Channels
- Send Messages
- Read Message History

You can generate an invite link with these permissions from the Discord Developer Portal under the "OAuth2" > "URL Generator" section.

## Troubleshooting

### "Used disallowed intents" Error

If you see this error:

```
Failed to login to Discord client: Error: Used disallowed intents
```

It means you're trying to use intents in your code that you haven't enabled in the Discord Developer Portal. Follow the steps above to enable the required intents.

### "Invalid Token" Error

If you see this error:

```
Failed to login to Discord client: Error [TokenInvalid]: An invalid token was provided.
```

Make sure you've correctly copied your bot token from the Discord Developer Portal and added it to your `.env` file as `DISCORD_TOKEN=your_token_here`.

## Additional Resources

- [Discord.js Guide - Intents](https://discordjs.guide/popular-topics/intents.html)
- [Discord Developer Documentation](https://discord.com/developers/docs/intro)
