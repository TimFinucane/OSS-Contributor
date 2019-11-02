import * as fs from 'fs';
import * as Discord from 'discord.js';
import CommandReciever from './commands';

const { discord_token } = JSON.parse(fs.readFileSync('secrets.store', { encoding: 'utf8' }));
const client = new Discord.Client();

const commands = new CommandReciever();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if(msg.content.startsWith('!'))
    commands.parse_message(msg);
});

client.login(discord_token);
