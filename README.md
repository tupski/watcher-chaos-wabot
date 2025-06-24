# Lords Mobile Hell Event - WhatsApp Notification
## `Chaos & Watcher` Notification

## 🚀 Introduction
Welcome to the **Chaos Watcher WhatsApp Bot**!
This bot integrates WhatsApp messaging features with custom commands to make your WhatsApp experience more interactive. Built with **Node.js** and [**WhatsApp Web.js**](https://wwebjs.dev/), this bot serves as a versatile communication tool.

Special thanks to [HephBot](https://hephbot.com) for providing inspiration and the Hell Event bot implementation on Discord. Their work has been pivotal for creating fun and interactive bots.

---

## ✨ Features & Commands

### ✅ Available Commands
The bot supports the following commands:

| Command | Description | Example | Output Example|
|-----------|-----------------------------------------------------------------------------|----------------------------------|----------------------------|
| **`!yell`** | Allows users to send a custom fun message to groups or specific channels. | `!yell Hello World!` | Hello World!
| **`!uptime`** | Displays how long the bot has been running. | `!uptime` | `Uptime: 0h 9m 58s` |
| **`!ping`**   | A quick way to check if the bot is active and online. | `!ping` | N/A |

---

### ❌ Commands & Features in Progress
Currently, the following feature is still under development:

| Command   | Description                                    |
|-----------|------------------------------------------------|
| **`!tagall`** | Tags all group members with an optional message. Usage: `!tagall [message]` |
| **`!hell`** | Displays the ongoing Hell Event data. If no events are currently active, it will show the last event time. |
| **`!hell watcherchaos`** | Enable only Watcher/Chaos Dragon notifications (admin only) |
| **`!hell all/on`** | Enable all Hell Event notifications (admin only) |
| **`!hell off`** | Disable Hell Event notifications for this group (admin only) |
| **`!hell status`** | Check current Hell Event notification settings |
| **`!monster`** | Shows today and tomorrow monster rotation. Usage: `!monster` or `!monster [monster_name]` |
| **`!ai`** | Ask AI assistant a question. Usage: `!ai <your question>` |
| **`!cmd`** | Set command permissions (admin only). Usage: `!cmd <command> <admin/all>` |
| **`!help`** | Show complete help and command reference |

### Anti Spam Link
* This feature automatically blocks or prevents the spread of harmful, spammy, or unwanted links in WhatsApp groups.
* Configure allowed links in the `ALLOWED_LINKS` environment variable (comma-separated).

### Monster Rotation
* Displays daily monster rotation schedule for Lords Mobile
* Automatic notifications at 11:55 AM (GMT+7) when monsters reset
* Search specific monsters to see when they will spawn
* 12-day rotation cycle with monsters like Gargantua, Hardrox, Jade Wyrm, etc.

### AI Assistant
* Powered by Google Gemini AI for intelligent responses
* Ask questions using `!ai <your question>`
* Quotes user questions and provides detailed answers
* Safety filters enabled for appropriate responses

### Permission Management
* Per-group command permissions (admin/all members)
* Hell Event notification preferences per group
* Settings are isolated per group (won't affect other groups)
* Admin-only commands: `!cmd` and Hell Event settings

### Enhanced Hell Event System
* Configurable notifications: all events, Watcher/Chaos only, or disabled
* Per-group settings for notification preferences
* Automatic filtering based on group preferences
* Status checking with `!hell status`
---

## 🛠️ Features & Output
- **Command Responses**: The bot listens to specific commands sent to group chats and responds accordingly.
- **Command Testing**: Commands such as `!hell`, `!ping`, `!uptime`, and `!yell` return interactive responses directly to the group.
- **Bot Stability**: Ensures all commands work reliably under various network conditions.
- **Web Interface**: A responsive web dashboard to view QR codes, message logs, and manage the bot.
  - **QR Code Scanner**: Easily scan the WhatsApp QR code from the web interface.
  - **Message Log**: View all sent and received messages in a paginated table.
  - **Real-time Updates**: Messages appear in real-time as they are sent or received.
  - **Message Management**: View message details and delete messages from the interface.

---

## 🖥️ How to Set Up
To set up and run this bot on your system:

### 1. Clone the Repository:
First, clone this repository to your local system:
```bash
git clone https://github.com/tupski/watcher-chaos-wabot.git
   ```
### 2. Install Dependencies:
Next, install all required dependencies by running:
   ```bash
   npm install
   ```
### 3. **Set Up Environment Variables**

#### **Step 1: Get Your Discord API Token**
- Visit [Discord Developer Portal](https://discord.com/developers/applications).
- Log in to your Discord account.
- Click on the **"New Application"** button to create a new application.
- Name your application (e.g., "WatcherBot").
- In the application settings, navigate to the **Bot** tab and click **"Add Bot"**.
  - Under the **Bot** tab, locate the Token. Copy this token.
    - This is your Discord API Key.

> **Important**: For full functionality, you need to enable the **MESSAGE CONTENT** intent in the Discord Developer Portal. See [DISCORD_SETUP.md](DISCORD_SETUP.md) for detailed instructions.
>
> If you want to enable Discord login for the web interface, you'll need to set up OAuth2. See [DISCORD_OAUTH_SETUP.md](DISCORD_OAUTH_SETUP.md) for instructions.
---
#### **Step 2: Get Your WhatsApp Group IDs**
- Open WhatsApp and set up groups for your bot's intended use.
- Obtain the group IDs from the group info:
  - Open the WhatsApp group you want to add to the bot.
  - Look at the group info or settings to find the group ID.
  - Alternatively, use the WhatsApp Web interface with your bot to inspect the group ID.
- Copy these group IDs and add them to your `.env` file in the `WHATSAPP_GROUP_IDS`.
> WhatsApp Group ID Example:
>
> **`12036316XXX303832@g.us`**

> **_you can also use multiple whatsapp group id separated by comma_**
>
> **in .env**
> `WHATSAPP_GROUP_IDS=12036316XXX303832@g.us,12036316XXX303832@g.us,12036316XXX303832@g.us`

---

#### **Step 3: Set Up Your Environment Variables**
- Create a `.env` file in the root of your repository with the following variables:
  ```bash
  DISCORD_TOKEN=your_discord_token
  WHATSAPP_CLIENT_ID=your_whatsapp_client_id
  WHATSAPP_GROUP_IDS=your_whatsapp_group_ids
  ALLOWED_LINKS=https://example.com
  TIMEZONE_OFFSET=7
  ```
- Replace the placeholders with your respective tokens and group IDs:
    - `your_discord_token`: Your Discord bot token.
    - `your_whatsapp_client_id`: Your unique WhatsApp client ID.
    - `your_whatsapp_group_ids`: Multiple group IDs can be separated by commas _(e.g., id1,id2,id3)_.
    - `https://example.com`: Allowed links that the bot will whitelist.
    - `TIMEZONE_OFFSET=7`: Adjust this value based on your local timezone.

### 4. Start the Bot:
   ```bash
   npm start
   ```
### 5. **Access the Web Interface:**
After starting the bot, you can access the web interface by opening your browser and navigating to:

   ```
   http://localhost:3000
   ```

From the web interface, you can:
- Scan the QR code to authenticate WhatsApp
- View and manage messages
- Monitor the bot's status in real-time

### 6. **Monitor the Logs:**
After successful startup, you should see:

   ```bash
   WhatsApp bot is ready!
   Server running on port 3000
   ```

---

## � Troubleshooting

### Common Issues and Solutions

#### Commands Not Working (!tagall, !hell)
1. **Check if the bot is properly authenticated with WhatsApp**
   - Make sure you've scanned the QR code successfully
   - Check the console for "WhatsApp client is ready!" message

2. **Verify environment variables**
   - Ensure `.env` file exists and contains all required variables
   - Check that `DISCORD_TOKEN` is set correctly (see DISCORD_SETUP.md)

3. **Discord Bot Issues**
   - Enable MESSAGE CONTENT intent in Discord Developer Portal
   - Verify the bot has proper permissions in your Discord server
   - Check that `DISCORD_CHANNEL_ID` matches your target channel

#### Tagall Command Issues
1. **"This command can only be used in group chats" Error**
   - Ensure you're using the command in a WhatsApp group, not private chat
   - Check console logs for group detection details
   - Bot will show group info in logs for debugging

2. **No Mentions Working**
   - Ensure bot has been added to the group properly
   - Check if group participants are loaded correctly
   - Bot needs to fetch participants which may take a moment

#### Anti Spam Link Not Working
1. **Check ALLOWED_LINKS configuration**
   - Ensure `ALLOWED_LINKS` is set in your `.env` file
   - Use comma-separated values for multiple allowed domains
   - Example: `ALLOWED_LINKS=https://example.com,https://trusted-site.com`

2. **Bot Permissions and Configuration**
   - Bot must be admin in WhatsApp group to delete messages
   - If bot can't delete messages, it will send warning instead
   - Supported link formats: `https://`, `http://`, `www.`, and `domain.com`
   - Configure `ALLOWED_LINKS` with domain names only (no http/https needed)
   - Example: `ALLOWED_LINKS=example.com,google.com,github.com`

#### Hell Event Filter Configuration
1. **ONLY_WATCHER_CHAOS Setting**
   - Set `ONLY_WATCHER_CHAOS=true` to only receive Watcher/Chaos Dragon notifications
   - Set `ONLY_WATCHER_CHAOS=false` to receive all Hell Event notifications
   - The `!hell` command always shows the latest event regardless of filter setting

#### Hell Command Shows "Data tidak tersedia"
1. **Discord Integration Issues**
   - Verify Discord bot token is correct
   - Check if the bot is in the correct Discord server
   - Ensure MESSAGE CONTENT intent is enabled
   - Verify `DISCORD_CHANNEL_ID` is correct

2. **No Hell Event Data**
   - The bot needs to receive at least one Hell Event message from Discord first
   - Check Discord channel for Hell Event messages in the correct format

#### Installation Issues
1. **Node.js Not Found**
   - Install Node.js from [nodejs.org](https://nodejs.org/)
   - Verify installation with `node --version` and `npm --version`

2. **Dependencies Issues**
   - Run `npm install` to install all dependencies
   - If issues persist, try `npm ci` for clean install

---

## �🙏 Acknowledgements
We would like to express our deepest gratitude to [HephBot](https://hephbot.com) for creating and sharing their amazing **Hell Event Bot**. Their contributions paved the way for this integration, and we are truly thankful for their work and dedication.

---

## 📝 License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this bot under the conditions of the MIT License.

---

## 📄 Contribution & Support
We value your feedback! If you encounter any bugs, issues, or have suggestions to improve the bot, feel free to submit an issue via [GitHub Issues](https://github.com/tupski/watcher-chaos-wabot/issues). Contributions through pull requests are always welcome!

- 🐞 **Found a bug?** Report it via GitHub Issues.
- 💬 **Have a feature suggestion?** Share your thoughts!
- 🛠️ **Want to contribute?** Fork the repository and submit a pull request.

Your support helps make this project better for everyone. Thank you!

---

## 📚 Additional Resources
For more information about WhatsApp Web API integration, visit the [wwebjs.dev Documentation](https://wwebjs.dev/).
It contains valuable information about WhatsApp's web client, its capabilities, and how you can extend the functionalities with **whatsapp-web.js**.

We hope you enjoy using this bot! If you face any setup challenges or technical issues, consult the documentation or reach out for assistance. Your journey matters to us!

Happy coding! 🚀
