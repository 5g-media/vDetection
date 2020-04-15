/**
 * @file Provides the module 'output_OpenCV_video-writer'.
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
 * @module output_OpenCV_video-writer
 * @requires node_modules:dotenv
 * @requires node_modules:opencv4nodejs
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const CV = require('opencv4nodejs');

/**
 * @constructs openCVVideoWriter
 * @description constructs a video writer.
 * @param {Object} _output - the video writer
 * @param {Function} setOutput - the setter function, sets a video writer
 * @param {Function} output - the getter function, gets a video writer
 * @param {Function} init - the init function, initiates the video writer.
 * @param {Function} write - the writer function, writes a video frame by frame into a local filesystem with the video writer
 * @param {Function} stop - the stop function, stops the video writer
 * @param {Function} reset - the reset function, resets the video writer
 * @fires CV:VideoWriter:write
 * @fires CV:VideoWriter:release
 * @fires CV:MAT:release
 */
var openCVVideoWriter = {
  _output: null,
  setOutput: function (environment) {
    openCVVideoWriter._output = new CV.VideoWriter(
      environment.outputLocalVideoPath() + environment.outputLocalVideoFilename() + '.' + environment.outputLocalVideoFileextension(),
      CV.VideoWriter.fourcc(environment.outputSettingsVideoType()),
      environment.processingSettingsFps(),
      new CV.Size(environment.outputSettingsVideoResolutionWidth(), environment.outputSettingsVideoResolutionHeight()),
      true
    );
  },
  output: function () {
    return openCVVideoWriter._output;
  },
  init: function (environment) {
    openCVVideoWriter.setOutput(environment);
  },
  write: function (environment, frameCounter, frame) {
    openCVVideoWriter.output().write(frame);
    frame.release();
  },
  stop: function () {
    return openCVVideoWriter.reset();
  },
  reset: function () {
    openCVVideoWriter.output().release();
    return Date.now();
  }
};

// export module 'output_OpenCV_video-writer'
module.exports = openCVVideoWriter;