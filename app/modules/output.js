/**
 * @file Provides the module 'output'.
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
 * @module output
 * @requires node_modules:dotenv
 * @requires modules:output_OpenCV_image-writer
 * @requires modules:output_OpenCV_video-writer
 * @requires modules:output_stream_passthrough-writer
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const OOCVIW = require('./output_OpenCV_image-writer');
const OOCVVW = require('./output_OpenCV_video-writer');
const OSPTW = require('./output_stream_passthrough-writer');

/**
 * @constructs Output
 * @description constructs an output object.
 * @param {Function} init - the init function, initiates the output graph.
 * @param {Function} step - the step function, calls the next step in the output graph.
 * @param {Function} stop - the stop function, stops the output graph.
 * @param {Function} reset - the reset function, resets the output graph.
 * @fires OOCVIW.write
 * @fires OSPTW.write
 * @fires OOCVVW.write
 * @fires CV:MAT:release
 */
var Output = {
  init: function (passThroughStream, environment) {
    if (passThroughStream) {
      OSPTW.init(passThroughStream);
    }
    if (environment.outputLocalVideoUse() && environment.processingSettingsFps()) {
      OOCVVW.init(environment);
    }
  },
  step: function (environment, frameCounter, frame) {
    if (environment.outputLocalImageUse()) {
      OOCVIW.write(environment, frameCounter, frame);
    }
    if (environment.outputLocalVideoUse()) {
      OOCVVW.write(environment, frameCounter, frame);
    }
    if (environment.outputServeUse()) {
      OSPTW.write(environment, frameCounter, frame);
    }
    frame.release();
  },
  stop: function (environment) {
    if (environment.outputLocalVideoUse()) {
      OOCVVW.stop();
    }
    if (environment.outputServeUse()) {
      OSPTW.stop();
    }
    return Output.reset();
  },
  reset: function () {
    return Date.now();
  }
};

// export module 'output'
module.exports = Output;