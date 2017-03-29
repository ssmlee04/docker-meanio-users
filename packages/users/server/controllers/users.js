/*jshint -W079 */
'use strict'

/*
 * Module dependencies.
 */
var validator = require('validator')
var mongoose = require('mongoose')
var Promise = require('bluebird')
var User = mongoose.model('User')
var async = require('async')
var config = require('meanio').getConfig()
var crypto = require('crypto')
var _ = require('lodash')
var templates = require('../template')
var sendMail = require('../tools/sendmail')
var opt = require('../tools/registertemplate')

var sendVerificationEmail = function(email, emailsalt) {
  var link = config.hostname + '/verify/' + emailsalt
  var mailOptions = opt(link, email)
  return sendMail(mailOptions)
}

var checkUserNotVerified = function(d) {
  if (!d || !d._id) {
    return Promise.reject('text-error-user')
  }
  if (d.verified) {
    return Promise.reject('text-error-user-already-verified')
  }
  return d
}

var checkUserExist = function(d) {
  if (!d || !d._id) {
    return Promise.reject('text-error-user')
  }
  this.user = JSON.parse(JSON.stringify(d))
  return d
}

/*
 * Logout
 */
exports.signout = function(req, res) {
  req.logout()
  res.json({success: 'text-success-logout'})
}

/*
 * Create user
 */
exports.create = function(req, res) {
  var info = req.body

  return Promise.bind({})
  .then(function() {
    return User.insert(info).bind(this).then(checkUserExist)
  }).then(function() {
    return sendVerificationEmail(this.user.email, this.user.emailsalt)
  }).then(function() {
    return _.omit(this.user, 'hashed_password', 'salt', 'emailsalt')
  }).then(function(d) {
    res.json({
      msg: d
    }) 
  }).catch(function(err) {
    var message = err.message
    if (err.name === 'ValidationError') {
      message = err.errors[Object.keys(err.errors)[0]].message
    }
    return res.json(400, {
      msg: message
    })
  })
}

exports.edit = function(req, res) {
  if (!req.user || !req.user._id) {
    return res.json(401, {error: 'text-error-unauthorized'})
  }
  var id = req.user._id.toString()
  var info = req.body

  info = _.omit(info, '_id', 'email', 'salt', 'hashed_password', 'roles')

  return Promise.bind({})
  .then(function() {
    return User.edit(id, info)
  }).then(function() {
    return res.status(200).json({
      msg: 'text-success-edit-user'
    })
  }).catch(function(err) {
    return res.json(500, {
      msg: err.message
    })
  })
}

exports.show = function(req, res) {
  return res.json(req.user)
}

// exports.editAvatarBase64 = function(req, res) {
//   if (!req.user) {
//     return res.json(401, {error: 'text-error-unauthorized'})
//   }

//   var user = JSON.parse(JSON.stringify(req.user))
//   var userId = user._id
//   var base64 = req.body.base64

//   User.setAvatarBase64(userId, base64)
//   .then(function() {
//     res.json({success: 'you have successfully set the avatar, grats..'})
//   }).catch(function(err) {
//     res.json(500, {error: err.message})
//   })
// }

exports.editpassword = function(req, res) {
  if (!req.user) {
    return res.json(401, {error: 'text-error-unauthorized'})
  }

  var oldpassword = req.body.oldpassword
  var password = req.body.password
  var id = req.user._id.toString()

  if (!oldpassword) {
    oldpassword = undefined
  }

  return Promise.cast(User.findOne({_id: id}).exec())
  .then(function(d) {
    if (d.authenticate(oldpassword) || !d.hashed_password) {
      d.password = password
      d.save(function(err, d) {
        if (err) {
          return res.status(500).json({
            error: 'text-error-update-password'
          })
        } else {
          return res.json({
            mes: 'text-success-update-password'
          })
        }
      })
    } else {
      return res.status(500).json({
        error: 'text-error-old-password-incorrect'
      })
    }
  })
}

/*
 * Resets the password
 */
exports.resetpassword = function(req, res, next) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function(err, user) {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    }
    if (!user) {
      return res.status(400).json({
        msg: 'Token invalid or expired'
      })
    }
    req.assert('password', 'Password must be between 8-20 characters long').len(8, 20)
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password)
    var errors = req.validationErrors()
    if (errors) {
      return res.status(400).send(errors)
    }
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.save(function(err) {
      req.logIn(user, function(err) {
        if (err) return next(err)
        return res.send({
          user: user,
        })
      })
    })
  })
}

/*
 * Callback for forgot password link
 */
exports.forgotpassword = function(req, res) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex')
        done(err, token)
      })
    },
    function(token, done) {
      User.findOne({
        $or: [{
          email: req.body.text
        }, {
          username: req.body.text
        }]
      }, function(err, user) {
        if (err || !user) {
          return done(true)
        }
        done(err, user, token)
      })
    },
    function(user, token, done) {
      user.resetPasswordToken = token
      user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
      user.save(function(err) {
        done(err, token, user)
      })
    },
    function(token, user, done) {
      var mailOptions = {
        to: user.email,
        from: config.emailFrom
      }
      mailOptions = templates.forgot_password_email(user, req, token, mailOptions)
      sendMail(mailOptions)
      done(null, true)
    }
  ],
  function(err, status) {
    var response = {
      msg: 'text-success-send-reset-email-if-user-exists'
    }
    res.json(response)
  })
}

/*
 * Resend confirmation email
 */
exports.resendConfirmation = function(req, res) {
  var email = req.body.email

  if (!validator.isEmail(email)) {
    return res.json(500, {error: 'text-error-email-invalid'})
  }

  return Promise.bind({})
  .then(function() {
    return Promise.cast(User.findOne({email: email}).exec()).bind(this).then(checkUserExist).then(checkUserNotVerified)
  }).then(function() {
    return sendVerificationEmail(email, this.user.emailsalt)
  }).then(function() {
    return res.json({
      msg: 'text-success-resend-confirmation-email'
    })
  }).catch(function(err) {
    return res.json(400, {
      error: err.message
    })
  })
}

/*
 * Verify user email
 */
exports.verifyEmail = function(req, res) {
  var emailsalt = req.params.emailsalt
  
  return Promise.resolve()
  .then(function() {
    return User.verifyEmail(emailsalt)
  }).then(function() {
    return res.json({
      msg: 'text-success-verify-email'
    })
  }).catch(function(err) {
    return res.json(500, {
      msg: err.message
    })
  })
}
