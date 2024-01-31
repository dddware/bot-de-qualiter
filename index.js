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

  Promise.all(youtube.subs.map(({ channelId, playlistId, q = "" }) => {
    const params = {
      key: youtube.key,
      part: "snippet",
      order: "date",
      maxResults: 50,
    };

    if (channelId) {
      params.channelId = channelId;
    } else if (playlistId) {
      params.playlistId = playlistId;
    } else {
      return new Promise((resolve, reject) => reject("Each entry must have a channelId or playlistId"));
    }

    return new Promise((resolve, reject) => {
      request(
        `https://www.googleapis.com/youtube/v3/${channelId ? "search" : "playlistItems"}?${qs.stringify(params)}`,
        { json: true },
        (err, res, body) => {
          if (err) {
            reject(err);
          } else if (res.statusCode >= 400) {
            reject(body.error.message);
          } else {
            const key = channelId || playlistId;

            const latestResult = body.items
              .filter(item => item.snippet.title.toLowerCase().includes(q.toLowerCase()))
              .sort((itemA, itemB) => itemB.snippet.publishedAt.localeCompare(itemA.snippet.publishedAt))
              .shift();

            const videoId = latestResult.id.videoId || latestResult.snippet.resourceId.videoId;

            if (latestResult
              && latestSaved[key]?.videoId !== videoId
              && (!latestSaved[key]?.publishedAt
                || latestSaved[key]?.publishedAt < latestResult.snippet.publishedAt
              )
            ) {
              latestSaved[key] = {
                videoId,
                publishedAt: latestResult.snippet.publishedAt,
              };

              resolve(videoId);
            }
          }

          resolve();
        }
      );
    }).then(videoId => videoId ? channel.send(`https://www.youtube.com/watch?v=${videoId}`) : null);
  })).then(() => {
    fs.writeFileSync(filePath, JSON.stringify(latestSaved), { encoding: "utf8" });
  }).catch(error => {
    console.error(error);
  }).finally(() => {
    client.destroy();
  });
});

client.login(discord.token);
