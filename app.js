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
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const linebotParser = bot.parser();

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

bot.on('message', e => {
  console.log('message event:', e);
  console.log('message text:', e.message.text);
  axios
    .post(`https://5427-114-32-167-155.jp.ngrok.io/webhooks/rest/webhook`, {
      sender: `${e.source.userId}`,
      message: e.message.text
    })
    .then(response => {
      console.log('response data:', response.data);
      if (!response.data.length) {
        return e.reply(`很抱歉!我不明白「${e.message.text}」是什麼意思，請重新嘗試!`);
      }

      if (response.data[0].buttons) {
        console.log('response text:', response.data[0].text);
        console.log('response buttons:', response.data[0].buttons);
        const items = response.data[0].buttons.map(button => ({
          type: 'action',
          action: {
            type: 'message',
            label: `${button.title}`,
            text: `${button.title}`
          }
        }));

        const message = {
          type: 'text',
          text: response.data[0].text,
          quickReply: {
            items
          }
        };
        e.reply(message);
      } else {
        console.log('response text:', response.data[0].text);
        e.reply(response.data[0].text);
      }
    })
    .catch(err => console.log(err));
});

bot.on('postback', e => {
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
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
          }
        }
      ).catch(err => console.log(err));
    case 'playVideo':
      e.reply({
        type: 'video',
        originalContentUrl:
          'https://rr3---sn-5goeenes.googlevideo.com/videoplayback?expire=1667545875&ei=s2ZkY5etMoOPyQX0h7WQBQ&ip=188.126.94.163&id=o-AJTD_GJuFNlBgyMuM0GPkJp_ziulhEL5uBA7tyvRIDJR&itag=22&source=youtube&requiressl=yes&mh=cO&mm=31%2C29&mn=sn-5goeenes%2Csn-5go7ynl6&ms=au%2Crdu&mv=m&mvi=3&pl=23&initcwndbps=1830000&spc=yR2vp4cZlqrlbpV-tylPn0QHW0ZYg84&vprv=1&mime=video%2Fmp4&ns=_qYJ3heYnUbO1aoG9EIoiMEI&cnr=14&ratebypass=yes&dur=152.787&lmt=1657822447940946&mt=1667524170&fvip=4&fexp=24001373%2C24007246&c=WEB&txp=6211224&n=tfZqsgX5skRFgQ&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Cmime%2Cns%2Ccnr%2Cratebypass%2Cdur%2Clmt&sig=AOq0QJ8wRAIgXTJs9rjjUXBOgWR7JBVKF55vca9oI10aPXIUmg3io-ECID668_hL10A7tcuv-TFhu3b7lXpFeZ6_H0PLgHVkE96H&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhAKW6-zrYJ5IXzgte51MCYmgdSj7Cp3HaERydMxKU4HiDAiEAp7KH87ZQ7pYHe5y_udg0tYSVGdl-38pLZg0oAbzw9c8%3D&title=%E8%8B%B1%E7%89%B9%E5%85%A7%E8%BB%9F%E9%AB%94%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8-%20-%20%E4%BC%81%E6%A5%AD%E5%BD%A2%E8%B1%A1%E5%BD%B1%E7%89%87',
        previewImageUrl:
          'https://i.ytimg.com/vi/dUNTBSsrl-c/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAV3jRBy5VdU8N_nvSgsV6XApPu8g'
      });
      break;
    default:
      return axios(
        `https://api.line.me/v2/bot/user/${e.source.userId}/richmenu/${process.env.DEFAULT_RICH_MENU_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
          }
        }
      ).catch(err => console.log(err));
  }
});

app.post('/', linebotParser);
app.listen(port, () => {
  console.info(`linebot server is running on http://localhost:${port} `);
});
