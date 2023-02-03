const fs = require("fs");
const request = require("request");
const { Client, Intents } = require("discord.js");
const { discord, openai } = require("./config");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on("messageCreate", message => {
  if (message.mentions.users.size !== 1 || message.mentions.users.first().id !== client.user.id) {
    return;
  }

  const prompt = message.content.replace(/<[^>]+>/, "").trim();

  request.post({
    url: "https://api.openai.com/v1/completions",
    headers: {
      "Authorization": "Bearer " + openai.key,
    },
    body: {
      prompt,
      model: "text-davinci-003",
      temperature: openai.temperature,
      max_tokens: 4097 - prompt.length,
    },
    json: true,
  }, (err, res, body) => {
    if (err) {
      return console.error(err);
    }

    client.channels.cache.get(message.channelId).send(body.choices[0].text.trim());
  });
});

client.login(discord.token);
