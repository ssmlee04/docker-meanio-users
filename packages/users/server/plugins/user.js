/*jshint -W079 */
'use strict'

var mongoose = require('mongoose')
var Promise = require('bluebird')
var _ = require('lodash')
var validator = require('validator')
// var path = require('path')
var crypto = require('crypto')
// var config = require('meanio').getConfig()
// var uploadfolder = config.uploadFolder
var randomstring = require('randomstring')

var checkUserExist = function(d) {
  if (!d || !d._id) {
    return Promise.reject(new Error('text-error-user'))
  }
  this.user = JSON.parse(JSON.stringify(d))
  return d
}

module.exports = exports = function lastModifiedPlugin (schema, options) {

  /*
   * Virtuals
   */
  schema.virtual('password').set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.hashPassword(password)
  }).get(function() {
    return this._password
  })

  /*
   * Pre-save hook
   */
  schema.pre('save', function(next) {
    if (this.isNew && this.provider === 'local' && this.password && !this.password.length) {
      return next(new Error('Invalid password'))
    }
    next()
  })

  schema.statics.insertFromFacebook = function(user) {
    user.roles = ['user']
    user.provider = 'facebook'

    return this.insertUserInfo(user)
  }

  schema.statics.insertUserInfo = function(user) {
    var that = this
    if (!user) {
      return Promise.reject(new Error('text-user-profile-incorrect'))
    }
    user.sex = ~~user.sex
    if (!validator.isEmail(user.email)) {
      return Promise.reject(new Error('text-email-format-incorrect'))
    }
    if (!user.name) {
      return Promise.reject(new Error('text-user-name-incorrect'))
    }
    if (!validator.isLength(user.password, 8, 100) && user.provider === 'local') {
      return Promise.reject(new Error('text-error-user-password-length-8-to-20'))
    }
    user.roles = user.roles || ['user']
    user.emailsalt = randomstring.generate(45)
    user.lon = user.lon || 0.01
    user.lat = user.lat || -90
    user.location = user.location || 'Antarctica'
    user.loc = [user.lon, user.lat]
    user.nickname = randomstring.generate()
    var tmp = randomstring.generate()
    user.image = 'http://www.gravatar.com/avatar/' + tmp + '?d=identicon&s=384'
    user.avatar = 'http://www.gravatar.com/avatar/' + tmp + '?d=identicon&s=200'

    return Promise.bind({})
    .then(function() {
      return Promise.cast(that.create(user)).bind(this).then(checkUserExist)
    // }).then(function(d) {
    //   var userId = this.user._id
    //   if (user.image && user.avatar) {

    //   } else if (process.env.NODE_ENV !== 'test' && base64img) {
    //     that.setAvatarBase64(userId, base64img)
    //   } else if (process.env.NODE_ENV !== 'test') {
    //     that.setAvatarUrl(userId)
    //   }
    //   return d
    })
  }

  schema.statics.edit = function(id, user) {
    var that = this
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Promise.reject(new Error('text-error-user'))
    }
    if (!user) {
      return Promise.reject(new Error('text-error-user update params'))
    }
    user = _.omit(user, '_id', 'email', 'username', 'salt', 'hashed_password', 'roles', 'emailsalt', 'verified', 'image', 'avatar')

    return Promise.bind({})
    .then(function() {
      return that.load(id).bind(this).then(checkUserExist)
    }).then(function() {
      return Promise.cast(that.update({_id: id}, user).exec())
    }).then(function() {
      return that.load(id)
    })
  }

  schema.statics.load = function(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Promise.reject(new Error('text-error-user'))
    }

    return Promise.cast(this.findOne({_id: id}, {hashed_password: 0, salt: 0, emailsalt: 0, wt: 0}).exec())
  }

  // schema.statics.setAvatarBase64 = function(id, base64img) {
  //   var that = this
  //   var Uploadmanager = mongoose.model('Uploadmanager')
    
  //   return Promise.bind({})
  //   .then(function() {
  //     return that.load(id).bind(this).then(checkUserExist)
  //   }).then(function() {
  //     return Uploadmanager.Base64ToAWSImageThumb(base64img)
  //   }).then(function(d) {
  //     this.image = d.image
  //     this.thumb = d.thumb
  //     return Promise.cast(that.update({_id: id}, {avatar: d.thumb, image: d.image}).exec())
  //   }).then(function() {
  //     return {
  //       image: this.image,
  //       thumb: this.thumb
  //     }
  //   })
  // }

  // schema.statics.setAvatarUrl = function(id, url) {
  //   url = url || 'http://www.gravatar.com/avatar/' + randomstring.generate() + '?d=identicon&s=384'
  //   var that = this
  //   if (!mongoose.Types.ObjectId.isValid(id)) {
  //     return Promise.reject(new Error('text-error-user'))
  //   }
  //   var Uploadmanager = mongoose.model('Uploadmanager')
  //   var pa = path.join(config.root, uploadfolder, randomstring.generate() + '.jpg')

  //   return Promise.bind({})
  //   .then(function() {
  //     return that.load(id).bind(this).then(checkUserExist)
  //   }).then(function() {
  //     return Uploadmanager.UrlToAWSImageThumb(url)
  //   }).then(function(d) {
  //     this.image = d.image
  //     this.thumb = d.thumb
  //     return Promise.cast(that.update({_id: id}, {avatar: d.thumb, image: d.image}).exec())
  //   }).then(function() {
  //     return {
  //       image: this.image,
  //       thumb: this.thumb
  //     }
  //   })
  // }

  // schema.statics.setAvatarPath = function(id, subpath) {
  //   if (!mongoose.Types.ObjectId.isValid(id)) {
  //     return Promise.reject(new Error('text-error-user'))
  //   }
  //   if (!subpath) {
  //     return Promise.resolve()
  //   }
  //   subpath = path.resolve(subpath)
  //   var that = this
  //   var Uploadmanager = mongoose.model('Uploadmanager')
    
  //   return Promise.bind({})
  //   .then(function() {
  //     return that.load(id).bind(this).then(checkUserExist)
  //   }).then(function() {
  //     return Uploadmanager.FileToAWSImageThumb(subpath)
  //   }).then(function(d) {
  //     this.image = d.image
  //     this.thumb = d.thumb
  //     return Promise.cast(that.update({_id: id}, {avatar: d.thumb, image: d.image}).exec())
  //   }).then(function() {
  //     return {
  //       thumb: this.thumb,
  //       image: this.image
  //     }
  //   })
  // }

  // unit tested
  schema.statics.delete = function(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Promise.reject(new Error('text-error-user-id'))
    }

    var that = this
    return Promise.resolve()
    .then(function() {
      return Promise.cast(that.remove({_id: id}).exec())
    })
  }


  /*
   * Methods
   */
  schema.methods = {

    /*
     * HasRole - check if the user has required role
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */

    hasRole: function(role) {
      return this.roles.indexOf('admin') !== -1 || this.roles.indexOf(role) !== -1
    },

    isOwner: function() {
      return this.roles.indexOf('admin') !== -1 || this.roles.indexOf('owner') !== -1
    },

    isUser: function() {
      return this.roles.indexOf('admin') !== -1 || this.roles.indexOf('user') !== -1
    },

    /*
     * IsAdmin - check if the user is an administrator
     *
     * @return {Boolean}
     * @api public
     */

    isAdmin: function() {
      return this.roles.indexOf('admin') !== -1
    },

    isRootAdmin: function() {
      return this.roles.indexOf('root') !== -1 && this.roles.indexOf('admin') !== -1
    },


    /*
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
      return this.hashPassword(plainText) === this.hashed_password
    },

    /*
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
      return crypto.randomBytes(16).toString('base64')
    },

    /*
     * Hash password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    hashPassword: function(password) {
      if (!password || !this.salt) {
        return ''
      }
      var salt = new Buffer(this.salt, 'base64')
      return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64')
    }
  }

}
