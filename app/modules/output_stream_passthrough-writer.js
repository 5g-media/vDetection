/**
 * @file Provides the module 'output_stream_passthrough-writer'.
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
 * @module output_stream_passthrough-writer
 * @requires node_modules:dotenv
 * @requires node_modules:opencv4nodejs
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const CV = require('opencv4nodejs');

/**
 * @constructs streamPassthroughWriter
 * @description constructs an passthrough stream writer.
 * @param {Object} _passThroughStream - the passthrough stream.
 * @param {Function} setPassThroughStream - the setter function, sets a passthrough stream.
 * @param {Function} passThroughStream - the getter function, gets a passthrough stream.
 * @param {Function} init - the init function, initiates the passthrough stream writer.
 * @param {Function} write - the writer function, writes a base64 string from an image into a pasthrough stream (pipe).
 * @param {Function} stop - the stop function, stops the passthrough stream writer.
 * @param {Function} reset - the reset function, resets the passthrough stream writer.
 * @fires CV:MAT:imencode
 * @fires CV:MAT:release
 * @fires stream:passthrough:write
 */
var streamPassthroughWriter = {
  _passThroughStream: null,
  setPassThroughStream: function (passThroughStream) {
    streamPassthroughWriter._passThroughStream = passThroughStream;
  },
  passThroughStream: function () {
    return streamPassthroughWriter._passThroughStream;
  },
  init: function (passThroughStream) {
    streamPassthroughWriter.setPassThroughStream(passThroughStream);
  },
  write: function (environment, frameCounter, frame) {
    if (streamPassthroughWriter.passThroughStream()) {
      try {
        var base64 = CV.imencode('.' + environment.outputSettingsImageType(), frame).toString('base64');
        streamPassthroughWriter.passThroughStream().write(Buffer.from(base64, 'base64'));
        frame.release();
      } catch (error) {}
    } else {
      frame.release();
    }
  },
  stop: function () {
    return streamPassthroughWriter.reset();
  },
  reset: function () {
    streamPassthroughWriter._passThroughStream = null;
    return Date.now();
  }
};

// export module 'output_stream_passthrough-writer'
module.exports = streamPassthroughWriter;