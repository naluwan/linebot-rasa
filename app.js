const express = require('express');
const app = express();
const session = require('express-session');
const linebot = require('linebot');
const passport = require('passport');
const axios = require('axios');
const lineNotifyRouter = require('./routes/line-notify');
const lineRouter = require('./routes/line');

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
  console.log(e.message.text);
  axios
    .post(`https://0cbe-114-32-167-155.jp.ngrok.io/webhooks/rest/webhook`, {
      sender: 'user',
      message: e.message.text,
    })
    .then((response) => {
      console.log(response);
      console.log(response.data[0].text);
      console.log(response.data[0].buttons);
      if (response.data[0].buttons) {
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
        e.reply(response.data[0].text);
      }
    })
    .catch((err) => console.log(err));
});

bot.on('postback', (e) => {
  console.log('postback event:', e);
  console.log('postback data:', e.postback.data);
  let data = querystring.parser(e.postback.data);
  console.log('postback action:', data);
  axios
    .post(`https://0cbe-114-32-167-155.jp.ngrok.io/webhooks/rest/webhook`, {
      sender: 'user',
      message: data.action,
    })
    .then((response) => {
      if (response.data[0].buttons) {
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
        e.reply(response.data[0].text);
      }
    })
    .catch((err) => console.log(err));
});

app.post('/', linebotParser);
app.listen(port, () => {
  console.info(`linebot server is running on http://localhost:${port} `);
});
