/**
 * @file Provides the module 'rest_authorization'.
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 *
 * @version 1.0.0
 *
 * @copyright BitTubes GmbH, 2019
 * @author Truong-Sinh An <truong-sinh.an@bittubes.com>
 * @license CC-BY-SA-4.0
 */

/**
 * @module rest_authorization
 * @requires node_modules:dotenv
 * @requires node_modules:basic-auth
 * @requires node_modules:validator
 * @requires node_modules:crypto
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Auth = require('basic-auth');
const Validator = require('validator');
const Crypto = require('crypto');

// prepare variables for authorization
const EnumRoles = process.env.AUTH_USER_ENUM_ROLES || 'Public,Learner,Editor,Teacher,Manager,Administrator';
const Roles = EnumRoles.split(',');

module.exports = {
  /**
   * @function getAccessLevel
   * @description Returns the code (bitshift verification) of the given role
   * @param {String} checkRole - the role to be checked
   * @returns {Integer}
   */
  getAccessLevel: function (checkRole) {
    if (checkRole) {
      var bitMask = "01";
      for (var role in Roles) {
        var intCode = parseInt(bitMask, 2);
        if (checkRole.toLowerCase() === Roles[role].toLowerCase()) {
          return intCode;
        } else {
          bitMask = (intCode << 1).toString(2);
        }
      }
    }
    return 1;
  },
  /**
   * @function checkAccessLevel
   * @description Returns true if user role is granted
   * @param {String} userRole - the role of the given user
   * @param {String} requestRole - the minimum role needed
   * @returns {Boolean}
   */
  checkAccessLevel: function (userRole, requestRole) {
    var userAccessLevel = this.getAccessLevel(userRole);
    var requestAccessLevel = this.getAccessLevel(requestRole);
    if (userAccessLevel < requestAccessLevel) {
      return false;
    }
    return true;
  },
  /**
   * @function getHeaderAuthorizationBasic
   * @description Returns the user credentials from the given Request
   * @param {Object} req - the request incl. the header 'Authorization'
   * @returns {Object}
   */
  getHeaderAuthorizationBasic: function (req) {
    return Auth(req);
  },
  /**
   * @function getHeaderXAuthorizationBasic
   * @description Returns the user credentials from the given Request
   * @param {Object} req - the request incl. the header 'X-Authorization'
   * @returns {Object}
   */
  getHeaderXAuthorizationBasic: function (req) {
    var credentials = Auth.parse(req.header('X-Authorization'));
    return credentials;
  },
  /**
   * @function getHeaderAuthorizationBearer
   * @description Returns a token from the given Request
   * @param {Object} req - the request incl. the header 'Authorization'
   * @returns {String}
   */
  getHeaderAuthorizationBearer: function (req) {
    var token = req.header('Authorization').split(' ').pop();
    return token;
  },
  /**
   * @function getUUID
   * @description Returns the UUID of the given user
   * @param {Object} credentials - the credentials of the given user
   * @returns {String}
   */
  getUUID: function (credentials) {
    var uuid = (credentials && credentials.hasOwnProperty('name') && Validator.isEmail(credentials.name)) ? credentials.name : null;
    return uuid;
  },
  /**
   * @function mt_rand
   * @description Returns a random number
   * @param {Integer} min - the minimum value of the range
   * @param {Integer} min - the maximum value of the range
   * @returns {Integer}
   */
  mt_rand: function (min, max) {
    var argc = arguments.length
    if (argc === 0) {
      min = 0
      max = 2147483647
    } else if (argc === 1) {
      throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given')
    } else {
      min = parseInt(min, 10)
      max = parseInt(max, 10)
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
  /**
   * @function dechex
   * @description Returns the hexadecimal value of a given number
   * @param {Integer} number - the given number
   * @returns {String}
   */
  dechex: function (number) {
    if (number < 0) {
      number = 0xFFFFFFFF + number + 1
    }
    return parseInt(number, 10)
      .toString(16)
  },
  /**
   * @function getHash
   * @description Returns the sha256 value of a given secret
   * @param {String} secret - the given secret
   * @returns {String}
   */
  getHash: function (secret) {
    const hash = Crypto.createHmac('sha256', secret).digest('hex');
    return hash;
  },
  /**
   * @function checkNestedProperty
   * @description Returns true if a nested property found in given object
   * @param {Object} obj - the given obj
   * @param {Array} arguments - the nested properties as array
   * @returns {Boolean}
   */
  checkNestedProperty: function (obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < args.length; i++) {
      if (!obj || !obj.hasOwnProperty(args[i])) {
        return false;
      }
      obj = obj[args[i]];
    }
    return true;
  }
};