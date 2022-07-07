# bot-de-qualiter

Get new videos from YouTube channels on Discord

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
        "channelId": "YouTube channel id"
      },
      {
        "channelId": "YouTube channel id",
        "q": "keywords to filter videos by their title"
      },
      // ...
    ]
  }
}
```

You can use [this online tool](https://commentpicker.com/youtube-channel-id.php) to find channel ids if needed.

## Usage

```sh
$ npm start
```

Latest videos from each channel (matching the `q` parameter, if there is one) will be stored locally in the `latest.json` file. Whenever this tool runs and a latest video changes, its link will be posted to the relevant Discord channel.

```sh
$ npm run reset
```

Removes the `latest.json` file to reset stored latest videos.
