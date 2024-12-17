require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

// Initialize Express app
const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Initialize WebSocket server on the same port
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
const wss = new WebSocket.Server({ server, path: '/api/socket' });

// Initialize the Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected.');

  ws.on('close', () => {
    console.log('WebSocket client disconnected.');
  });
});

// Route to serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get all guilds the bot is in
app.get('/api/guilds', (req, res) => {
  const guilds = client.guilds.cache.map((guild) => ({
    id: guild.id,
    name: guild.name,
  }));
  res.json(guilds);
});

// Endpoint to get users in a specific guild
app.get('/api/guild/:guildID/users', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(req.params.guildID);
    const members = await guild.members.fetch();

    const users = members.map((member) => ({
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching guild members:', error);
    res.status(500).json({ error: 'Failed to fetch guild members' });
  }
});

// Endpoint to get roles in a specific guild
app.get('/api/guild/:guildID/roles', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(req.params.guildID);
    const roles = await guild.roles.fetch();

    const roleList = roles.map((role) => ({
      id: role.id,
      name: role.name,
      position: role.position,
    }));

    res.json(roleList);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Endpoint to unban a user
app.post('/api/guilds/:guildID/unban/:userID', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(req.params.guildID);
    await guild.members.unban(req.params.userID);
    res.json({ message: `User with ID ${req.params.userID} has been unbanned.` });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Endpoint to kick a user
app.post('/api/guild/:guildID/kick/:userID', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(req.params.guildID);
    await guild.members.kick(req.params.userID);
    res.json({ message: `User with ID ${req.params.userID} has been kicked.` });
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({ error: 'Failed to kick user' });
  }
});

// Endpoint to ban a user
app.post('/api/guild/:guildID/ban/:userID', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(req.params.guildID);
    await guild.members.ban(req.params.userID);
    res.json({ message: `User with ID ${req.params.userID} has been banned.` });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Discord bot login
client.login(process.env.DISCORD_BOT_TOKEN);

// Set bot presence when ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [],
    status: 'invisible',
  });
});

// Log and broadcast messages via WebSocket
client.on('messageCreate', async (message) => {

  

  const messageData = {
    sender: message.author.username,
    guild: message.guild.name,
    channel: message.channel.name,
    message: message.content,
  };

    console.log(messageData)

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageData));
    }
  });
});
