/**
 * @file Provides the module 'express_rest'.
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
 * @module express_rest
 * @requires node_modules:dotenv
 * @requires node_modules:express
 * @requires node_modules:axios
 * @requires modules:rest
 * @requires modules:rest_authorization
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// define express router 'rest'
var express = require('express');
var router = express.Router();

// require modules
const Axios = require('axios');
const Rest = require('./rest');
const Authorization = require('./rest_authorization');

// prepare authorization
const AuthUSE = (process.env.AUTH_REST_USE.toLowerCase() == 'true') || false;
const AuthPROT = process.env.AUTH_REST_PROT || 'http';
const AuthHOST = process.env.AUTH_REST_HOST || 'localhost';
const AuthPORT = process.env.AUTH_REST_PORT || '3131';
const AuthBASE = process.env.AUTH_REST_BASE || '/user/authentication/info';
const AuthURL = AuthPROT + '://' + AuthHOST + ':' + AuthPORT + AuthBASE;
const AuthMIN = process.env.AUTH_REST_MIN_ROLE || 'Manager';

// define express middleware
router.use(function (req, res, next) {
  // define headers for express middleware
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Authorization, Content-Length, X-Requested-With');
  // console.log(new Date().toString() + ' -- request: ' + req.method + ' -- authorization: ' + authUSE);
  // intercepts OPTIONS method
  if (req.method.toLowerCase() === 'options') {
    res.sendStatus(200);
  }
  // authorization
  else if (AuthUSE && req.method.toLowerCase() !== 'get') {
    if (!req.headers.authorization) {
      return res.status(403).json(Rest.getResponseBody(403, 'Forbidden', null));
    } else {
      var token = Authorization.getHeaderAuthorizationBearer(req);
      Axios.get(AuthURL, {
          headers: {
            Authorization: "Bearer " + token
          }
        })
        .then(function (response) {
          var role = response.data.data.role;
          if (Authorization.checkAccessLevel(role, AuthMIN)) {
            next();
          } else {
            res.status(403).json(Rest.getResponseBody(403, 'Forbidden', null));
          }
        })
        .catch(function (error) {
          res.status(403).json(Rest.getResponseBody(403, 'Forbidden', null));
        });
    }
  } else {
    next();
  }
});

// define and require routes for router 'rest'
router.use('/', require('../routes/detections').router);

// export router 'rest'
module.exports = router;