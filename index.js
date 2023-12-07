const fs = require("fs");
const request = require("request");
const qs = require("qs");
const { Client, Intents } = require("discord.js");
const { discord, youtube } = require("./config");
const filePath = "./latest.json";
let latestSaved = {};

try {
  latestSaved = JSON.parse(fs.readFileSync(filePath, { encoding: "utf8" }));
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
      maxResults: 50,
    };

    return new Promise(resolve => {
      request(
        `https://www.googleapis.com/youtube/v3/search?${qs.stringify(params)}`,
        { json: true },
        (err, res, body) => {
          if (err) {
            console.error(err);
          } else {
            const latestResult = body.items.filter(item => item.snippet.title.toLowerCase().includes(q.toLowerCase())).shift();

            if (latestResult
              && latestSaved[channelId]?.videoId !== latestResult.id.videoId
              && (!latestSaved[channelId]?.publishedAt
                || latestSaved[channelId]?.publishedAt < latestResult.snippet.publishedAt
              )
            ) {
              latestSaved[channelId] = {
                videoId: latestResult.id.videoId,
                publishedAt: latestResult.snippet.publishedAt,
              };

              resolve(latestResult.id.videoId);
            }
          }

          resolve();
        }
      );
    }).then(videoId => videoId ? channel.send(`https://www.youtube.com/watch?v=${videoId}`) : null);
  })).then(() => {
    fs.writeFileSync(filePath, JSON.stringify(latestSaved), { encoding: "utf8" });
    client.destroy();
  });
});

client.login(discord.token);
