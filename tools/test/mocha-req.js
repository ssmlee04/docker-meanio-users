'use strict'

process.env.NODE_ENV = 'test'

process.env.NODE_CONFIG_DIR = './config/env'

var appRoot = __dirname + '/../../'

require(appRoot + 'server.js')

require('meanio/lib/core_modules/module/util').preload(appRoot + '/packages/**/server', 'model')
