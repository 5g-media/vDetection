/**
 * @file Provides the express route /swagger API.
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
 * @module swagger
 * @requires node_modules:dotenv
 * @requires node_modules:express
 * @requires modules:rest
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// define express route 'swagger'
var express = require('express');
var router = express.Router();

// require modules
const Rest = require('../modules/rest');

// prepare variables for swagger
const SwaggerUSE = (process.env.SWAGGER_DOC_USE.toLowerCase() == 'true') || false;
const SwaggerPATH = process.env.SWAGGER_DOC_PATH || '../../swagger/api-doc/swagger';

// require swagger api documentation
const Swagger = require(SwaggerPATH);

// define route /swagger
router.route('/swagger')
  .get(function (req, res) {
    if (SwaggerUSE) {
      res.json(Swagger);
    } else {
      res.status(418).json(Rest.getResponseBody(418, 'No Response', null));
    }
  });

// export module swagger
module.exports.router = router;
