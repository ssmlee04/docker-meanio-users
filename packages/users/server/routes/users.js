/*jshint -W079 */
'use strict'

// User routes use users controller
var users = require('../controllers/users')
var _ = require('lodash')
var jwt = require('jsonwebtoken')
var config = require('meanio').getConfig()

module.exports = function(MeanUser, app, auth, database, passport) {

  app.route('/api/v1/users/me')
    .put(users.edit)

  // app.route('/api/v1/users/editavatarbase64')
  //   .post(users.editAvatarBase64)

  app.route('/api/v1/users/editpassword')
    .put(users.editpassword)

  app.route('/api/v1/auth/logout')
    .get(users.signout) 

  app.route('/api/v1/auth/register')
    .post(users.create)

  app.route('/api/v1/auth/forgot-password')
    .post(users.forgotpassword)

  app.route('/api/v1/auth/reset/:token')
    .post(users.resetpassword)

  app.route('/api/v1/auth/resendconfirmation')
    .post(users.resendConfirmation)

  app.route('/api/v1/auth/verifyemail/:emailsalt(*)')
    .get(users.verifyEmail)
  
  app.route('/api/v1/auth/loggedin')
    .get(function(req, res) {
      res.send(req.isAuthenticated() ? {user: req.user} : {})
    })

  app.route('/api/v1/auth/login')
    .post(function(req, res, next) {
      passport.authenticate('user', {}, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()})
        } else if (message) {
          return res.json(500, {error: message.message.toString()})
        }
        var payload = _.omit(JSON.parse(JSON.stringify(user)), 'hashed_password', 'salt', 'emailsalt')
        var escaped = JSON.stringify(payload) 
        escaped = encodeURI(escaped)

        var token = jwt.sign(escaped, config.secret)

        return res.send({
          token: token,
          user: payload
        })
      })(req, res, next)
    })
  
  app.route('/api/v1/auth/facebook/token')
    .post(function(req, res, next) {
      passport.authenticate('facebook-token', {}, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()})
        } else if (message) {
          return res.json(500, {error: message.message.toString()})
        }
        var payload = _.omit(JSON.parse(JSON.stringify(user)), 'hashed_password', 'salt', 'emailsalt')
        var escaped = JSON.stringify(payload) 
        escaped = encodeURI(escaped)

        var token = jwt.sign(escaped, config.secret)

        return res.send({
          token: token,
          user: payload
        })
      })(req, res, next)
    })
}
