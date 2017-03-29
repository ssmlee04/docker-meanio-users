/*jshint -W079 */
'use strict'

var mongoose = require('mongoose')
var LocalStrategy = require('passport-local').Strategy
var FacebookTokenStrategy = require('passport-facebook-token').Strategy
var User = mongoose.model('User')
var config = require('meanio').getConfig()
var Promise = require('bluebird')
// var _ = require('lodash')
var randomstring = require('randomstring')

module.exports = function(passport) {
  
  // Serialize the user id to push into the session
  passport.serializeUser(function(user, done) {
    done(null, user._id)
  })

  // Deserialize the user object based on a pre-serialized token
  // which is the user id
  passport.deserializeUser(function(id, done) {
    return Promise.cast(User.findOne({_id: id}, '-salt -hashed_password').exec())
    .then(function(d) {
      done(null, d)
    }).catch(function(err) {
      done(err, null)
    })
  })

  // Use local strategy
  passport.use('user', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    User.findOne({
      email: email, roles: {$in : ['user']}
    }, function(err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, {
          message: 'text-unknown-user'
        })
      }
      if (!user.authenticate(password)) {
        return done(null, false, {
          message: 'text-invalid-password'
        })
      }
      if (!user.verified) {
        return done(null, false, {
          message: 'text-error-email-not-verified'
        })
      }
      return done(null, user)
    })
  }))

  passport.use('facebook-token', new FacebookTokenStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    User.findOne({'facebook.id': profile.id }, function (err, user) {
      if (err) {
        return done(err)
      }
      if (user) {
        return done(err, user)
      }
      user = new User({
        name: profile.displayName,
        email: profile.emails && profile.emails[0].value || randomstring.generate() + '@ami.com',
        username: profile.username || profile.emails[0].value.split('@')[0],
        provider: 'facebook',
        facebook: profile._json,
        roles: ['authenticated'],
        image:  profile.photos && profile.photos[0].value,
        avatar:  profile.photos && profile.photos[0].value
      });
      user.save(function(err) {
        if (err) {
          console.log(err);
          return done(null, false, {message: 'text-error-facebook-login'});
        } else {
          return done(err, user);
        }
      });
    })
  }))

  return passport
}
