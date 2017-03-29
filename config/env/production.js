'use strict'

module.exports = {
  db: 'mongodb://' + (process.env.MONGODB_HOST || 'localhost') + ':' + (process.env.MONGODB_PORT || '27017') + '/' + (process.env.MONGODB_DB || 'db') + '-prod',
  dbOptions: {
    user: process.env.MONGODB_USER || '',
    pass: process.env.MONGODB_PASS || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    dbOptions: {
      pass: process.env.REDIS_PASS || ''
    }
  },
  debug: false,
  aggregate: false,
  mongoose: {
    debug: false
  },
  facebook: {
    clientID: process.env.FACEBOOK_CLIENT_ID || 'client',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
  },
  mailer: {
    email: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    service: '', // Gmail, SMTP
    auth: {
      user: process.env.MAIL_AUTH_USER || '',
      pass: process.env.MAIL_AUTH_PASS || ''
    }
  },
  secret: 'SOME_TOKEN_SECRET'
}
