/**
 * @file Provides the Node.js server with APIs and Swagger.
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 *
 * @version 0.0.1
 *
 * @copyright BitTubes GmbH, 2019
 * @author Truong-Sinh An <truong-sinh.an@bittubes.com>
 * @license CC-BY-SA-4.0
 */

/**
 * @requires node_modules:dotenv
 * @requires node_modules:express
 * @requires node_modules:body-parser
 * @requires node_modules:minimist
 * @requires node_modules:swagger-node-express
 * @requires node_modules:morgan
 * @requires modules:express_doc
 * @requires modules:express_rest
 * @requires modules:synchronization
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require 'express' web-framework to provide APIs
var express = require('express');
var app = express();

// require router 'doc' and 'rest'
const Doc = require('./app/modules/express_doc');
const Rest = require('./app/modules/express_rest');

// require and prepare logger morgan
const LogLevels = process.env.LOG_LEVEL_ENUM.toLowerCase().split(',');
const LogLevel = (LogLevels.indexOf(process.env.LOG_LEVEL.toLowerCase()) > -1) ? process.env.LOG_LEVEL.toLowerCase() : 'dev';
var logger = require('morgan');
app.use(logger(LogLevel));

// require and prepare bodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// define router 'doc' and 'rest'
app.use('/doc', Doc);
app.use('/rest', Rest);

// prepare variables for server (vdetection-manager)
const RPU = (process.env.REVERSE_PROXY_USE.toLowerCase() == 'true') || false;
const Prot = (RPU) ? process.env.REVERSE_PROXY_PROT : 'http';
const Host = (RPU) ? process.env.REVERSE_PROXY_HOST : 'localhost';
const Port = (RPU) ? parseInt(process.env.REVERSE_PROXY_PORT, 10) : parseInt(process.env.APP_PORT, 10);
const Base = (RPU) ? process.env.REVERSE_PROXY_BASE : '/';
app.set('prot', Prot);
app.set('host', Host);
app.set('port', Port);
app.set('base', Base);

// swagger config
const SwaggerUI = (process.env.SWAGGER_UI_USE.toLowerCase() == 'true') || false;
if (SwaggerUI) {
  // define router 'swagger'
  var subpath = express();
  app.use('/swagger', subpath);
  var argv = require('minimist')(process.argv.slice(2));
  var swagger = require('swagger-node-express').createNew(subpath);
  app.use(express.static('swagger/ui'));
  // configurate swagger
  swagger.setApiInfo({
    title: "vdetection-manager API specification",
    description: "[Swagger] API specification for vdetection-manager (/rest)",
    termsOfServiceUrl: "",
    contact: "truong-sinh.an@bittubes.com",
    license: "",
    licenseUrl: ""
  });
  swagger.configureSwaggerPaths('', 'swagger/api-doc', '');
  // set and display the application URL
  const SwaggerURL = Prot + '://' + Host + ':' + Port + Base;
  console.log('swagger running on ' + SwaggerURL);
  swagger.configure(SwaggerURL, '1.0.0');
}

var server = app.listen(Port);

// require module 'synchronization'
const Synchronization = require('./app/modules/synchronization');
Synchronization.init(server).then(function () {
  Synchronization.sync('welcome');
});