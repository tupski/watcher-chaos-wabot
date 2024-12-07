# WhatsApp Bot - Chaos Watcher

## 🚀 Introduction
Welcome to the **Chaos Watcher WhatsApp Bot**!  
This bot integrates WhatsApp messaging features with custom commands to make your WhatsApp experience more interactive. Built with **Node.js** and **WhatsApp Web.js**, this bot serves as a versatile communication tool.

Special thanks to [HephBot](https://hephbot.com) for providing inspiration and the Hell Event bot implementation on Discord. Their work has been pivotal for creating fun and interactive bots.

---

## ✨ Features & Commands

### ✅ Available Commands
The bot supports the following commands:
- **`!hell`**: A fun command inspired by Hell Events.  
- **`!yell`**: Enables users to send fun messages to groups or specific channels.  
- **`!uptime`**: Displays how long the bot has been running.  
- **`!ping`**: A quick way to check if the bot is active and online.

### ❌ Commands in Progress
Currently, the following feature is still under development:
- **`!tagall`**: A command that intends to tag all group members (currently unavailable).

---

## 🛠️ Features & Output
- **Command Responses**: The bot listens to specific commands sent to group chats and responds accordingly.
- **Command Testing**: Commands such as `!hell`, `!ping`, `!uptime`, and `!yell` return interactive responses directly to the group.
- **Bot Stability**: Ensures all commands work reliably under various network conditions.

---

## 🖥️ How to Set Up
To set up and run this bot on your system:

1. Clone this repository:
   ```bash
   git clone https://github.com/tupski/watcher-chaos-wabot.git
2. Install Dependencies:
   ```bash
   npm install
3. **Set Up Environment Variables**:

   Copy or configure the `.env` file with your environment settings:

   ```bash
   DISCORD_TOKEN=your_discord_token
   WHATSAPP_CLIENT_ID=your_whatsapp_client_id
   WHATSAPP_GROUP_IDS=your_whatsapp_group_ids
   ALLOWED_LINKS=https://example.com
   TIMEZONE_OFFSET=7
4. Start the Bot:
   ```bash
   node index.js
5. **Monitor the Logs:**

    After successful startup, you should see:

   ```bash
   WhatsApp bot is ready!

---

## 🙏 Acknowledgements
Special thanks to [HephBot](https://hephbot.com) for creating and sharing their Hell Event Bot. Without their contribution, this integration would not have been possible.

---

## 📝 License
This project is licensed under the MIT License.

---

## 📄 Contribution & Support
If you find any issue, bug, or have suggestions, feel free to open an issue via [GitHub Issues](https://github.com/tupski/watcher-chaos-wabot/issues). Contributions are welcome!

---

We hope you enjoy using this bot! If you encounter any challenges during setup, consult the documentation or reach out for assistance.