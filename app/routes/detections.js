/**
 * @file Provides the express route /detections API.
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
 * @module detections
 * @version 1.0.0
 * @requires node_modules:dotenv
 * @requires node_modules:express
 * @requires modules:rest
 * @requires modules:detection-ffmpeg-jpeg
 * @requires models:detection-schema
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// define express route 'detection'
var express = require('express');
var router = express.Router();

// define express json-schema validator
var { Validator, ValidationError } = require('express-json-validator-middleware');
var validator = new Validator({ allErrors: true, verbose: true });
var validate = validator.validate;

// require modules
const Rest = require('../modules/rest');
const { environment, vDetection } = require('../modules/input');

// require schema
const EnvironmentSchema = require('../models/environment-schema');

// functions
const checkNested = function (obj) {
  var args = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < args.length; i++) {
    if (!obj || !obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
};

// define route /detections/start
router.route('/detections/start')
  .post(validate({ body: EnvironmentSchema }), function (req, res) {
    try {
      var customInputSourceURL = (checkNested(req.body, 'config', 'input', 'source', 'url')) ? req.body.config.input.source.url : null;
      if (customInputSourceURL) {
        environment.setInputSourceURL(customInputSourceURL);
        console.log('custom source source url', customInputSourceURL);
      }
      var customProcessingSettingsFPS = (checkNested(req.body, 'config', 'processing', 'settings', 'fps')) ? req.body.config.processing.settings.fps : null;
      if (customProcessingSettingsFPS) {
        environment.setProcessingSettingsFps(customProcessingSettingsFPS);
        console.log('custom processing settings fps', customProcessingSettingsFPS);
      }
      var customOutputSettingsImageType = (checkNested(req.body, 'config', 'output', 'settings', 'image', 'type')) ? req.body.config.output.settings.image.type : null;
      if (customOutputSettingsImageType) {
        environment.setOutputSettingsImageType(customOutputSettingsImageType);
        console.log('custom output settings image type', customOutputSettingsImageType);
      }
      var customOutputSettingsImageWidth = (checkNested(req.body, 'config', 'output', 'settings', 'image', 'width')) ? parseInt(req.body.config.output.settings.image.width, 10) : null;
      if (customOutputSettingsImageWidth) {
        environment.setOutputSettingsImageResolutionWidth(customOutputSettingsImageWidth);
        console.log('custom output settings image width', customOutputSettingsImageWidth);
      }
      var customOutputSettingsImageHeight = (checkNested(req.body, 'config', 'output', 'settings', 'image', 'height')) ? parseInt(req.body.config.output.settings.image.height, 10) : null;
      if (customOutputSettingsImageHeight) {
        environment.setOutputSettingsImageResolutionHeight(customOutputSettingsImageHeight);
        console.log('custom output settings image height', customOutputSettingsImageHeight);
      }
      var customOutputSettingsVideoType = (checkNested(req.body, 'config', 'output', 'settings', 'video', 'type')) ? req.body.config.output.settings.video.type : null;
      if (customOutputSettingsVideoType) {
        environment.setOutputSettingsVideoType(customOutputSettingsVideoType);
        console.log('custom output settings video type', customOutputSettingsVideoType);
      }
      var customOutputSettingsVideoWidth = (checkNested(req.body, 'config', 'output', 'settings', 'video', 'width')) ? parseInt(req.body.config.output.settings.video.width, 10) : null;
      if (customOutputSettingsVideoWidth) {
        environment.setOutputSettingsVideoResolutionWidth(customOutputSettingsVideoWidth);
        console.log('custom output settings video width', customOutputSettingsVideoWidth);
      }
      var customOutputSettingsVideoHeight = (checkNested(req.body, 'config', 'output', 'settings', 'video', 'height')) ? parseInt(req.body.config.output.settings.video.height, 10) : null;
      if (customOutputSettingsVideoHeight) {
        environment.setOutputSettingsVideoResolutionHeight(customOutputSettingsVideoHeight);
        console.log('custom output settings video height', customOutputSettingsVideoHeight);
      }
      var customOutputServeFRMT = (checkNested(req.body, 'config', 'output', 'serve', 'frmt')) ? req.body.config.output.serve.frmt : null;
      if (customOutputServeFRMT) {
        environment.setOutputServeFRMT(customOutputServeFRMT);
        console.log('custom output serve format', customOutputServeFRMT);
      }
      var customOutputServeURL = (checkNested(req.body, 'config', 'output', 'serve', 'url')) ? req.body.config.output.serve.url : null;
      if (customOutputServeURL) {
        environment.setOutputServeURL(customOutputServeURL);
        console.log('custom output serve url', customOutputServeURL);
      }
      vDetection.start(environment).then(function (data) {
        res.json(Rest.getResponseBody(200, 'ok', data));
      }).catch(function (err) {
        res.status(409).json(Rest.getResponseBody(409, 'Error executing request', err));
      });
    } catch (err) {
      res.status(400).json(Rest.getResponseBody(400, 'Error executing request', null));
    }
  });

// define route /detections/stop
router.route('/detections/stop')
  .post(validate({ body: EnvironmentSchema }), function (req, res) {
    try {
      vDetection.stop(environment).then(function (data) {
        res.json(Rest.getResponseBody(200, 'ok', data));
      }).catch(function (err) {
        res.status(409).json(Rest.getResponseBody(409, 'Error executing request', err));
      });
    } catch (err) {
      res.status(400).json(Rest.getResponseBody(400, 'Error executing request', null));
    }
  });

// Error handler for validation errors
router.use(function (err, req, res, next) {
  if (err instanceof ValidationError) {
    res.status(400).json(Rest.getResponseBody(400, 'Error executing request', err.validationErrors));
    next();
  } else next(err);
});

// export module 'detections'
module.exports.router = router;
