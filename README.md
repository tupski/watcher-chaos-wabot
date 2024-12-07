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
| **`!hell`** | Displays the ongoing Hell Event data. If no events are currently active, it will show **"Not available."** and fetch last hell event. | `!hell` | N/A                        |
| **`!yell`** | Allows users to send a custom fun message to groups or specific channels. | `!yell Hello World!` | Hello World!
| **`!uptime`** | Displays how long the bot has been running. | `!uptime` | `Uptime: 0h 9m 58s` |
| **`!ping`**   | A quick way to check if the bot is active and online. | `!ping` | N/A |

---

### ❌ Commands in Progress
Currently, the following feature is still under development:

| Command   | Description                                    |
|-----------|------------------------------------------------|
| **`!tagall`** | A command that intends to tag all group members (currently unavailable). I am still working on this command. |


---

## 🛠️ Features & Output
- **Command Responses**: The bot listens to specific commands sent to group chats and responds accordingly.
- **Command Testing**: Commands such as `!hell`, `!ping`, `!uptime`, and `!yell` return interactive responses directly to the group.
- **Bot Stability**: Ensures all commands work reliably under various network conditions.

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
---
#### **Step 2: Get Your WhatsApp Group IDs**
- Open WhatsApp and set up groups for your bot's intended use.
- Obtain the group IDs from the group info:
  - Open the WhatsApp group you want to add to the bot.
  - Look at the group info or settings to find the group ID.
  - Alternatively, use the WhatsApp Web interface with your bot to inspect the group ID.
- Copy these group IDs and add them to your `.env` file in the `WHATSAPP_GROUP_IDS`.

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
   node index.js
   ```
### 5. **Monitor the Logs:**
After successful startup, you should see:

   ```bash
   WhatsApp bot is ready!
   ```

---

## 🙏 Acknowledgements
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
