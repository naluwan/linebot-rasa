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
        originalContentUrl:
          'https://du.sf-converter.com/go?payload=1*eJzVVEuv20QY%2FStXV%2BqsSGqP35VGlRPn4dw0ufZNcutsIsd2nEk8fj%2BSIBYICVGJCgmBWLBh11UFArFAav9Ne%2Bmuf4GxbyntgkURC5CiM5OJv%2B%2FzOWdOPj7PoiJ1vHkanN873%2BZ5nN27e7eqqvYxKvJi7bWdiNyt7NzZ3i%2FRauHwW1zOp5Pe%2BUdvKnX3gwvtwsXR%2BxPTlGu1WlnYSvhNkIbeqe1HkR94JXa9qGnV7OLAPq5tZ3%2FfO8Q49RArihJUFJHjgYcRk5i%2BJRFNt4%2FdnTrTgvQUqRXAMYKM0GZloQ1Zvg05FmAXRS11Mh0nHDmpsX3wmeXQFjs7Zpl4MszmsbHZ5%2F2LsoyVK51ZTgHObR%2BxPANuWaM3LEHqJQV9kywL0NHLANmi2RIQgjj2DuxCBZAQvcOKnr35JoYifTpDdkHPUrcApESEAkYciAMEeYBDnDtV6K7jDLGMIksCHR476GjCMub6%2FWjs9UbX8qi7wCcr7E%2FsXvcgSzIo47RELCCYeKhR%2Bg7sk5gHYYa4URJeZtlymGcTPXVPpDet9lWlAx%2Bnzes7gRcinmehwMjALVIEJdgWGQgCkiNWkKHI81BkWAXKkgjqs9oASRJFGWxKKjQH9p4X2wEuvabhhhpFyTAMy0lcrQjdSpAXgYOuex2Q018FjmUhhCBEckcwTAmnM1Mcij4la6c2lejWa1rsYQo4rsGtgVpSC9oYUqv41or6NHYo1lrQpdaCLmFGgVKlWBOlC6VIkZIDwZ%2FTyLYuIDXUT5C6hjRNynp8XDd%2FxxpaiH2kDrju6qBWpqH786C3WfrmSlCOy1ivsGZeRXy6iYbeUT2kLU52zC3rk%2BwS6l3d0LBZmddc0JXGnPTQ8XjLyMe5ZvlORzPKiaZgEe4G04OtdY07nEY%2FoBk4TRhjJFemSgeuB%2FNlAa%2BYYmUMZ%2BN5ON8MjYSfaKG675tdBRaRu7rIy6NpdPWeyGpylbfGeNcvQhJmyeXK4vWBlFvXFuSya9tatNi9IjgdmtQmdP%2FLpHIisOsdzQ5XXzyW4xsUGhRrFJnmQsIGby8n36BUI03S%2FyrqjeofGnVF4mRRUd5GXeDk96IuCLykSLz870Vd%2FEdRv7XyPxh2m1XmTJ6HPXJiHnhiXmGXeVioPjPS13PLnjtLsl9HB60vRzTs3dExvNoKZFJIfV7bWEa4cg3tmCS9oTByLxcLftbJ5HgdFdzfhX024DPdt6rY2kw3hPWk%2FcpczAcTY6dk8XFHeNfdDSLnwUPyoKtroqQlA3WK%2FX3fOuzVi4uMqNp8HJyCAC5WSUfdrop0ZRf2hIY9x3ng0aS%2FePb4xfOfzsbq1exMUyfd3tnrZ1%2FcfPbLqyefvnj%2Bw%2B%2Ff%2FPrqyecvHz25%2Berrm%2B9%2Ffv3s0dnN0y9f%2Ffj45dPvXv727fiYYudsUV9G2vLWz0zNz%2B%2F99QfwyR%2BQ5MuY*1667292592*09ee57192a709ec9',
        previewImageUrl:
          'https://i.ytimg.com/vi/dUNTBSsrl-c/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAV3jRBy5VdU8N_nvSgsV6XApPu8g',
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
