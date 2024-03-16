const { Client, Intents } = require("discord.js");
const wiki = require("wikipedia");
const { discord, wikipedia } = require("./config");

function getYearDifference(start, end) {
  const endDate = end ? new Date(end) : new Date();
  return Math.floor((endDate - new Date(start)) / (1000 * 60 * 60 * 24 * 365.2422));
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on("messageCreate", message => {
  if (message.mentions.users.size !== 1 || message.mentions.users.first().id !== client.user.id) {
    return;
  }

  const query = message.content.replace(/<[^>]+>/, "").trim();

  (async () => {
    try {
      wiki.setLang(wikipedia.language);
      let response = `"${query}" isn't the name of anyone I know, dead or alive. Sorry!`;
      const search = await wiki.search(query, { limit: 1 });
      const pageTitle = search?.results?.[0]?.title;

      if (pageTitle) {
        const summary = await wiki.summary(pageTitle);

        const birthMatch = summary.extract_html.match(/<time class="nowrap bday" datetime="([^"]+)">/);
        const deathMatch = summary.extract_html.match(/<time class="nowrap dday" datetime="([^"]+)">/);

        if (!birthMatch) {
          // do nothing
        } else if (!deathMatch) {
          response = `☀️ ${pageTitle} is still alive! They're ${getYearDifference(birthMatch[1])} years old.`;
        } else {
          response = `🪦 ${pageTitle} is no longer with us! They died at ${getYearDifference(birthMatch[1], deathMatch[1])}.`
        }
      }

      client.channels.cache.get(message.channelId).send(response);
    } catch (err) {
      console.error(err);
    }
  })();
});

client.login(discord.token);
