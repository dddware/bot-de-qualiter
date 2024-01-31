# bot-de-qualiter

Get new videos from YouTube channels and playlists on Discord

## Setup

```sh
$ npm i
$ cp config.json.dist config.json
```

Edit the newly created file:

```json
{
  "discord": {
    "token": "Discord bot token",
    "channelId": "Discord channel id"
  },
  "youtube": {
    "key": "YouTube API key",
    "subs": [
      {
        "channelId": "YouTube channel id",
        "q": "keywords to filter videos by their title"
      },
      {
        "playlistId": "YouTube playlist id"
      },
      // ...
    ]
  },
  "openai": {
    "key": "OpenAI API key", // cf. infra
    "temperature": 0         // 0-1
  }
}
```

You can use [this online tool](https://commentpicker.com/youtube-channel-id.php) to find channel ids if needed. Playlist ids are directly accessible from client-facing URLs: `https://www.youtube.com/playlist?list={playlistId}`

## Usage

```sh
$ npm start
```

Latest videos from each channel (matching the `q` parameter, if there is one) will be stored locally in the `latest.json` file. Whenever this tool runs and a latest video changes, its link will be posted to the relevant Discord channel.

```sh
$ npm run reset
```

Removes the `latest.json` file to reset stored latest videos.

```sh
$ npm run gpt
```

Bonus feature: the bot will answer messages where it is mentioned using ChatGPT (run in the background using e.g. `pm2` if you need to).
