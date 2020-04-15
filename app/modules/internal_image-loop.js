/**
 * @file Provides the module 'internal_image-loop'.
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
 * @module internal_image-loop
 * @requires node_modules:dotenv
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const CV = require('opencv4nodejs');
const {
  PassThrough
} = require('stream');

/**
 * @constructs imageLoop
 * @description constructs an image-loop object.
 * @param {Object} _out - the stream passthrough object.
 * @param {Integer} _intervalID - the interval id.
 * @param {Function} setOut - the setter function, sets a stream passthrough object.
 * @param {Function} out - the getter function, gets a stream passthrough object.
 * @param {Function} setIntervalID - the setter function, sets an interval id.
 * @param {Function} intervalID - the getter function, gets an interval id.
 * @param {Function} start - the start function, starts the image-loop.
 * @param {Function} stop - the stop function, stops the image-loop.
 * @param {Function} reset - the reset function, resets the image-loop.
 * @fires stream:passthrough:write
 */
var imageLoop = {
  _out: null,
  _intervalID: null,
  setOut: function () {
    imageLoop._out = new PassThrough();
  },
  out: function () {
    return imageLoop._out;
  },
  setIntervalID: function (id) {
    imageLoop._intervalID = id;
  },
  intervalID: function () {
    return imageLoop._intervalID;
  },
  start: function (environment) {
    try {
      imageLoop.setOut();
      var width = environment.outputSettingsVideoResolutionWidth();
      var height = environment.outputSettingsVideoResolutionHeight();
      switch (environment.outputSettingsImageType()) {
        case 'png':
          var image = new CV.Mat(height, width, CV.CV_8UC4, [0, 0, 0, 0]);
          break;
        case 'jpg':
          var image = new CV.Mat(height, width, CV.CV_8UC1, 255);
          break;
        default:
          console.log('loop:', 'no image type selected');
          var image = new CV.Mat(height, width, CV.CV_8UC1, 255);
          break;
      }
      const LoopImage = Buffer.from(CV.imencode('.' + environment.outputSettingsImageType(), image).toString('base64'), 'base64');
      const Interval = 1000 / environment.processingSettingsFps();
      imageLoop.setIntervalID(setInterval(function () {
        imageLoop.out().write(LoopImage);
      }, Interval));
      return imageLoop.out();
    } catch (error) {}
  },
  stop: function () {
    clearInterval(imageLoop.intervalID());
    return imageLoop.reset();
  },
  reset: function () {
    imageLoop._out = null;
    imageLoop._intervalID = null;
    return Date.now();
  }
};

// export module 'internal_image-loop'
module.exports = imageLoop;