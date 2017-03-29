'use strict'

/**
 * Module dependencies.
 */
var mean = require('meanio')
// var winston = require('winston')
var compression = require('compression')
var morgan = require('morgan')
var express = require('express')
var config = mean.loadConfig()
// var session = require('express-session')
// var redisStore = require('connect-redis')(session)
var bodyParser = require('body-parser')

if (config.isBigConsolelog) {
  require('./../config/console')
}

module.exports = function(app, db) {

  app.use(function (req, res, next) {
    res.setHeader('Cache-Control', 'no-cache')
    next()
  })

  app.set('showStackError', true)

  // Prettify HTML
  app.locals.pretty = true

  // cache=memory or swig dies in NODE_ENV=production
  app.locals.cache = 'memory'

  // Should be placed before express.static
  // To ensure that all assets and data are compressed (utilize bandwidth)
  app.use(compression({ level: 9 }))

  // Adding robots and humans txt
  app.use('/public', express.static(config.root + '/public'))
  
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  app.use(bodyParser.json())

  // Only use logger for development environment
  app.use(morgan('dev'))
}
