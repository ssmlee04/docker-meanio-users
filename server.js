process.chdir(__dirname)
'use strict'

var winston = require('winston')

process.env.NODE_CONFIG_DIR = './config/env'
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// Requires meanio .
var mean = require('meanio')
var cluster = require('cluster')
var deferred = require('q').defer()
var debug = require('debug')('cluster')
var sys = require('sys')
var exec = require('child_process').exec;

// Code to run if we're in the master process or if we are not in debug mode/ running tests

if ((cluster.isMaster) &&
  (process.execArgv.indexOf('--debug') < 0) &&
  (process.env.NODE_ENV !== 'test') && (process.env.NODE_ENV !== 'development') &&
  (process.execArgv.indexOf('--singleProcess') < 0)) {
  // if (cluster.isMaster) {

  debug(`Production Environment`)
  // Count the machine's CPUs
  var cpuCount = process.env.CPU_COUNT || require('os').cpus().length
  if (process.env.NODE_ENV !== 'production') {
    cpuCount = 1
  }

  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    debug(`forking ${i}`)
    cluster.fork()
  }

  // Listen for dying workers
  cluster.on('exit', function (worker) {
    // Replace the dead worker, we're not sentimental
    debug(`Worker ${worker.id} died :(`)
    cluster.fork()
  })

// Code to run if we're in a worker process
} else {
  var workerId = 0
  if (!cluster.isMaster) {
    workerId = cluster.worker.id
  }
  // Creates and serves mean application
  mean.serve({ workerid: workerId }, function (app) {
    var config = app.getConfig()
    var port = config.https && config.https.port ? config.https.port : config.http.port
    debug(`MEAN app started on port ${port} (${process.env.NODE_ENV}) with cluster worker id ${workerId}`)

    deferred.resolve(app)

    exec('say \'' + (config.app && config.app.name || '') + ' backend server started at port ' + port + '\'', function(error, stdout, stderr) { 
      sys.puts(stdout) 
    })
    
    winston.info('Mean app started on port ' + port + ' (' + process.env.NODE_ENV + ') cluster.worker.id:' + workerId)
  })
}

module.exports = deferred.promise
