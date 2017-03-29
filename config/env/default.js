'use strict'

var path = require('path'),
  rootPath = path.normalize(__dirname + '/../..')

module.exports = {
  app: {
    name: process.env.APP
  },
  root: rootPath,
  uploadFolder: '/public/misc',
  http: {
    port: process.env.PORT || 3000
  },
  https: {
    port: false,

    // Paths to key and cert as string
    ssl: {
      ca: 'ssl/' + process.env.NODE_ENV + '.ca-bundle',
      key: 'ssl/' + process.env.NODE_ENV + '.key',
      cert: 'ssl/' + process.env.NODE_ENV + '.crt'
    }
  },
  hostname: process.env.HOST || process.env.HOSTNAME,
  templateEngine: 'swig',

  // The secret should be set to a non-guessable string that
  // is used to compute a session hash
  sessionSecret: 'secret',

  // The name of the MongoDB collection to store sessions in
  sessionCollection: 'sessions',

  // The session cookie settings
  sessionCookie: {
    path: '/',
    httpOnly: false,
    // If secure is set to true then it will cause the cookie to be set
    // only when SSL-enabled (HTTPS) is used, and otherwise it won't
    // set a cookie. 'true' is recommended yet it requires the above
    // mentioned pre-requisite.
    secure: true,
    // Only set the maxAge to null if the cookie shouldn't be expired
    // at all. The cookie will expunge when the browser is closed.
    maxAge: 600000
  },

  // The session cookie name
  sessionName: 'connect.sid',

  // show full error messages
  isBigConsolelog: process.env.BIG_CONSOLE
}
