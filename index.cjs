const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const fs = require("fs");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const WEEKLY_FILE = "weekly.json";

if (!fs.existsSync(WEEKLY_FILE)) fs.writeFileSync(WEEKLY_FILE, "{}");

let data = JSON.parse(fs.readFileSync(WEEKLY_FILE));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", (msg) => {
  if (!msg.guild || msg.author.bot) return;

  let id = msg.author.id;
  data[id] = (data[id] || 0) + 1;
  fs.writeFileSync(WEEKLY_FILE, JSON.stringify(data));
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command
const commands = [
  {
    name: "leaderboard",
    description: "Show weekly message leaderboard",
  },
];

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "leaderboard") {
    let items = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let text = items
      .map((x, i) => `#${i + 1} <@${x[0]}> — ${x[1]} msgs`)
      .join("\n");

    if (!text) text = "No data yet.";

    await i.reply(text);
  }
});

(async () => {
  if (!CLIENT_ID) {
    console.error("❌ CLIENT_ID env missing");
    process.exit(1);
  }
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered");
    client.login(TOKEN);
  } catch (e) {
    console.log(e);
  }
})();