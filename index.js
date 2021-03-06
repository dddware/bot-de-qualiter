const fs = require("fs");
const request = require("request");
const qs = require("qs");
const { Client, Intents } = require("discord.js");
const { discord, youtube } = require("./config");
const filePath = "./latest.json";
let latest = {};

try {
  latest = JSON.parse(fs.readFileSync(filePath, { encoding: "utf8" }));
} catch (error) {}

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", () => {
  const channel = client.channels.cache.get(discord.channelId);

  if (!channel) {
    console.error("Discord channel not found");
    return;
  }

  Promise.all(youtube.subs.map(({ channelId, q = "" }) => {
    const params = {
      key: youtube.key,
      channelId: channelId,
      part: "snippet",
      order: "date",
      maxResults: 5,
      q
    };

    return new Promise(resolve => {
      request(
        `https://www.googleapis.com/youtube/v3/search?${qs.stringify(params)}`,
        { json: true },
        (err, res, body) => {
          if (err) {
            console.error(err);
          } else {
            const currentLatest = body.items.filter(item => item.snippet.title.toLowerCase().includes(q)).shift();

            if (currentLatest && latest[channelId] !== currentLatest.id.videoId) {
              latest[channelId] = currentLatest.id.videoId;
              resolve(currentLatest.id.videoId);
            }
          }

          resolve();
        }
      );
    }).then(videoId => videoId ? channel.send(`https://www.youtube.com/watch?v=${videoId}`) : null);
  })).then(() => {
    fs.writeFileSync(filePath, JSON.stringify(latest), { encoding: "utf8" });
    client.destroy();
  });
});

client.login(discord.token);
