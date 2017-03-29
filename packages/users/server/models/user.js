/*jshint -W079 */
'use strict'

/**
 * Module dependencies.
 */
var Promise = require('bluebird')
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var userplugin = require('./../plugins/user')

/**
 * Validations
 */
var validatePresenceOf = function(value) {
  // If you are authenticating by any of the oauth strategies, don't validate.
  return (this.provider && this.provider !== 'local') || (value && value.length)
}

var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User')
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0)
  })
}

/**
 * User Schema
 */

var baseSchema = {
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    // required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Please enter a valid email'],
    validate: [validateUniqueEmail, 'text-error-email-in-use']
  },
  token: {type: String},
  avatar: {type: String},
  image: {type: String},
  phone: {type: String},
  address: {type: String},
  nationality: {type: Number},
  nation: {type: String},
  sex: {type: Number}, // male 1, female 2
  hashed_password: {
    type: String,
    validate: [validatePresenceOf, 'text-error-password-length']
  },
  provider: {
    type: String,
    default: 'local'
  },
  salt: {type: String},
  birthdate: {type: Date},
  roles: { type: Array, default: []},
  emailsalt: {type: String},
  verified: {type: Boolean},
  facebook: {},
  google: {},
  github: {},
  resetPasswordToken: String,
  resetPasswordExpires: Date
}

var UserSchema = new Schema(baseSchema, {
  collection: 'oc_user',
  timestamps: true
})

UserSchema.plugin(userplugin)

UserSchema.statics.insert = function(user) {
  user.provider = 'local'
  user.roles = ['user']
  
  return this.insertUserInfo(user)
}

UserSchema.statics.verifyEmail = function(emailsalt) {
  var that = this
  if (!emailsalt) {
    return Promise.reject(new Error('text-error-email-code'))
  }
  return Promise.cast(that.findOne({emailsalt: emailsalt}).exec())
  .then(function(d) {
    if (!d || !d._id) {
      return Promise.reject(new Error('text-error-email-code'))
    } else {
      return Promise.cast(that.update({_id: d._id}, {emailsalt: null, verified: true}).exec())
    }
  })
}

// UserSchema.statics.addRole = function(userId, role) {
//   var that = this
//   if (!validator.isAlphanumeric(role)) {
//     return Promise.reject(new Error('failed to add this role: ' + role))
//   }
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return Promise.reject(new Error('user id incorrect'))
//   }
//   return Promise.cast(that.update({_id: userId, roles: {$nin : [role]}}, {$push : {roles : role}}).exec())
// }

// UserSchema.statics.removeRole = function(userId, role) {
//   var that = this
//   if (!validator.isAlphanumeric(role)) {
//     return Promise.reject(new Error('failed to add this role: ' + role))
//   }
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return Promise.reject(new Error('user id incorrect'))
//   }
//   return Promise.cast(that.update({_id: userId, roles: {$in : [role]}}, {$pull : {roles : role}}).exec())
// }

mongoose.model('User', UserSchema)
