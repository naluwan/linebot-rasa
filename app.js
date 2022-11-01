const express = require('express');
const app = express();
const session = require('express-session');
const linebot = require('linebot');
const passport = require('passport');
const axios = require('axios');
const querystring = require('querystring');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const port = process.env.PORT || 3330;

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

const linebotParser = bot.parser();

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

bot.on('message', (e) => {
  console.log('message event:', e);
  console.log('message text:', e.message.text);
  axios
    .post(`https://0cbe-114-32-167-155.jp.ngrok.io/webhooks/rest/webhook`, {
      sender: `${e.source.userId}`,
      message: e.message.text,
    })
    .then((response) => {
      console.log('response data:', response.data);
      if (!response.data.length) {
        return e.reply(
          `很抱歉!我不明白「${e.message.text}」是什麼意思，請重新嘗試!`,
        );
      }

      if (response.data[0].buttons) {
        console.log('response text:', response.data[0].text);
        console.log('response buttons:', response.data[0].buttons);
        const items = response.data[0].buttons.map((button) => ({
          type: 'action',
          action: {
            type: 'message',
            label: `${button.title}`,
            text: `${button.title}`,
          },
        }));

        const message = {
          type: 'text',
          text: response.data[0].text,
          quickReply: {
            items,
          },
        };
        e.reply(message);
      } else {
        console.log('response text:', response.data[0].text);
        e.reply(response.data[0].text);
      }
    })
    .catch((err) => console.log(err));
});

bot.on('postback', (e) => {
  console.log('postback event:', e);
  console.log('postback data:', e.postback.data);
  let data = querystring.parse(e.postback.data);
  console.log('postback action:', data);
  switch (data.action) {
    case 'nextPage':
      return axios(
        `https://api.line.me/v2/bot/user/${e.source.userId}/richmenu/${process.env.SECOND_RICH_MENU_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
          },
        },
      ).catch((err) => console.log(err));
    case 'playVideo':
      e.reply({
        type: 'video',
        originalContentUrl: 'https://youtu.be/dUNTBSsrl-c',
        previewImageUrl: 'https://youtu.be/rpJbLpqUECk',
      });
      break;
    default:
      return axios(
        `https://api.line.me/v2/bot/user/${e.source.userId}/richmenu/${process.env.DEFAULT_RICH_MENU_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
          },
        },
      ).catch((err) => console.log(err));
  }
});

app.post('/', linebotParser);
app.listen(port, () => {
  console.info(`linebot server is running on http://localhost:${port} `);
});
