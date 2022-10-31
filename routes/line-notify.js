require('dotenv').config();
const express = require('express');
const router = express.Router();
const rp = require('request-promise');

router.get('/', function (req, res, next) {
  const state = 'state';
  res.redirect(
    `https://notify-bot.line.me/oauth/authorize?response_type=code&client_id=${process.env['LINE_NOTIFY_CLIENT_ID']}&redirect_uri=${process.env['LINE_NOTIFY_CALLBACK_URL']}&scope=notify&state=${state}`,
  );
});

router.get('/callback', async function (req, res, next) {
  const oauthToken = await rp({
    method: 'POST',
    uri: `https://notify-bot.line.me/oauth/token?grant_type=authorization_code&code=${req.query.code}&redirect_uri=${process.env['LINE_NOTIFY_CALLBACK_URL']}&client_id=${process.env['LINE_NOTIFY_CLIENT_ID']}&client_secret=${process.env['LINE_NOTIFY_CLIENT_SECRET']}`,
    json: true,
  });

  const notify = await rp({
    method: 'POST',
    url: 'https://notify-api.line.me/api/notify',
    auth: {
      bearer: oauthToken.access_token,
    },
    form: {
      message: '有成功了嗎?',
    },
    json: true,
  });

  if (notify.status === 200) {
    return res.send('LINE notify send success!');
  }
  res.send('LINE notify send failed!');
});

module.exports = router;
