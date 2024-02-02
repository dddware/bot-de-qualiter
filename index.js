const fs = require("fs");
const request = require("request");
const qs = require("qs");
const { Client, Intents } = require("discord.js");
const { discord, youtube } = require("./config");
const filePath = "./latest.json";
let latestSaved = {};

const pluck = (obj, keys) => keys.reduce((acc, key) => ({ ...acc, ...(key in obj ? { [key]: obj[key] } : {}) }), {});

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

  Promise.all(youtube.subs.map(sub => {
    const params = {
      key: youtube.key,
      part: "snippet",
      order: "date",
      maxResults: 50,
    };

    if (sub.channelId) {
      params.channelId = sub.channelId;
    } else if (sub.playlistId) {
      params.playlistId = sub.playlistId;
    } else {
      return new Promise((resolve, reject) => reject("Each entry must have a channelId or playlistId"));
    }

    return new Promise((resolve, reject) => {
      request(
        `https://www.googleapis.com/youtube/v3/${sub.channelId ? "search" : "playlistItems"}?${qs.stringify(params)}`,
        { json: true },
        (err, res, body) => {
          if (err) {
            reject(err);
          } else if (res.statusCode >= 400) {
            reject(body.error.message);
          } else {
            const key = sub.channelId || sub.playlistId;

            const latestResult = body.items
              .filter(item => item.snippet.title.toLowerCase().includes((sub.q || "").toLowerCase()))
              .sort((itemA, itemB) => itemB.snippet.publishedAt.localeCompare(itemA.snippet.publishedAt))
              .shift();

            if (!latestResult) {
              console.log("No video found", sub);
            } else {
              const videoId = latestResult.id.videoId || latestResult.snippet.resourceId.videoId;
              const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

              if (latestSaved[key]?.videoId === videoId) {
                console.log(`Latest video (${videoUrl}) has already been sent`, sub);
              } else if (latestSaved[key]?.publishedAt && latestSaved[key].publishedAt >= latestResult.snippet.publishedAt) {
                console.log(`Latest video (${latestResult.snippet.publishedAt}) is no newer than ${latestSaved[key].publishedAt}`, sub);
              } else {
                latestSaved[key] = {
                  videoId,
                  publishedAt: latestResult.snippet.publishedAt,
                };

                console.log(`Newer video (${videoUrl}) found`, sub);
                resolve(videoUrl);
              }
            }
          }

          resolve();
        }
      );
    }).then(videoUrl => videoUrl ? channel.send(videoUrl) : null);
  })).then(() => {
    fs.writeFileSync(filePath, JSON.stringify(latestSaved), { encoding: "utf8" });
  }).catch(error => {
    console.error(error);
  }).finally(() => {
    client.destroy();
  });
});

client.login(discord.token);
