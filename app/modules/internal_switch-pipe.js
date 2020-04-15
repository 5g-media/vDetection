/**
 * @file Provides the module 'internal_switch-pipe'.
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
 * @module internal_switch-pipe
 * @requires node_modules:dotenv
 * @requires node_modules:dev-null
 * @requires node_modules:stream
 * @requires modules:internal_image-loop
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const DevNull = require('dev-null');
const {
  PassThrough
} = require('stream');
const In1 = require('./internal_image-loop');

/**
 * @constructs switchPipe
 * @description constructs an image-loop object.
 * @param {Object} _streamIn1 - the streamIn1 source object.
 * @param {Object} _streamIn2 - the streamIn2 source object.
 * @param {Object} _streamOut - the streamOut stream passthrough object.
 * @param {Object} _sink - the sink object.
 * @param {Boolean} _stateIn1Out - the stateIn1Out flag.
 * @param {Function} setStreamIn1 - the setter function, sets a streamIn1 passthrough object.
 * @param {Function} streamIn1 - the getter function, gets a streamIn1 passthrough object.
 * @param {Function} setStreamIn2 - the setter function, sets a streamIn2 passthrough object.
 * @param {Function} streamIn2 - the getter function, gets a streamIn2 passthrough object.
 * @param {Function} setStreamOut - the setter function, sets a streamOut passthrough object.
 * @param {Function} streamOut - the getter function, gets a streamOut passthrough object.
 * @param {Function} setSink - the setter function, sets a sink object.
 * @param {Function} sink - the getter function, gets a sink object.
 * @param {Function} setStateIn1Out - the setter function, sets the stateIn1Out flag.
 * @param {Function} stateIn1Out - the getter function, gets the stateIn1Out flag.
 * @param {Function} switch - the switch function, switches both in channels.
 * @param {Function} start - the start function, starts the switch-pipe.
 * @param {Function} addStream - the addStream function, adds a second stream to the switch-pipe passthrough to a sink.
 * @param {Function} stop - the stop function, stops the switch-pipe.
 * @param {Function} reset - the reset function, resets the switch-pipe.
 * @fires stream:passthrough:pipe
 * @fires stream:passthrough:unpipe
 */
var switchPipe = {
  _streamIn1: null,
  _streamIn2: null,
  _streamOut: null,
  _sink: null,
  _stateIn1Out: null,
  setStreamIn1: function () {
    switchPipe._streamIn1 = new PassThrough();
  },
  setStreamIn2: function () {
    switchPipe._streamIn2 = new PassThrough();
  },
  setStreamOut: function () {
    switchPipe._streamOut = new PassThrough();
  },
  setSink: function () {
    switchPipe._sink = DevNull();
  },
  setStateIn1Out: function (state) {
    switchPipe._stateIn1Out = state;
  },
  streamIn1: function () {
    return switchPipe._streamIn1;
  },
  streamIn2: function () {
    return switchPipe._streamIn2;
  },
  streamOut: function () {
    return switchPipe._streamOut;
  },
  sink: function () {
    return switchPipe._sink;
  },
  stateIn1Out: function () {
    return switchPipe._stateIn1Out;
  },
  pipeIn1OutIn2Sink: function () {
    switchPipe.streamIn1().pipe(switchPipe.streamOut())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.streamIn2().pipe(switchPipe.sink())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.setStateIn1Out(true);
  },
  pipeIn1SinkIn2Out: function () {
    switchPipe.streamIn1().pipe(switchPipe.sink())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.streamIn2().pipe(switchPipe.streamOut())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.setStateIn1Out(false);
  },
  unpipeIn1OutIn2Sink: function () {
    switchPipe.streamIn1().unpipe(switchPipe.streamOut());
    switchPipe.streamIn2().unpipe(switchPipe.sink());
  },
  unpipeIn1SinkIn2Out: function () {
    switchPipe.streamIn1().unpipe(switchPipe.sink());
    switchPipe.streamIn2().unpipe(switchPipe.streamOut());
  },
  switch: function () {
    console.log('switch-pipe:', 'switching streams');
    if (switchPipe.stateIn1Out()) {
      switchPipe.unpipeIn1OutIn2Sink();
      switchPipe.pipeIn1SinkIn2Out();
    } else {
      switchPipe.unpipeIn1SinkIn2Out();
      switchPipe.pipeIn1OutIn2Sink();
    }
  },
  start: function (fps, width, height) {
    console.log('switch-pipe:', 'start with 1st stream');
    switchPipe.setStreamIn1();
    switchPipe.setStreamOut();
    switchPipe.streamIn1().pipe(switchPipe.streamOut())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    In1.start(fps, width, height).pipe(switchPipe.streamIn1())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.setStateIn1Out(true);
    return switchPipe.streamOut();
  },
  addStream: function (stream) {
    console.log('switch-pipe:', 'adding 2nd stream');
    switchPipe.setStreamIn2();
    switchPipe.setSink();
    switchPipe.streamIn2().pipe(switchPipe.sink())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    stream.pipe(switchPipe.streamIn2())
      .on('close', function (code, signal) {})
      .on('end', function (code, signal) {})
      .on('error', function (error) {});
    switchPipe.switch();
  },
  stop: function () {
    // In1.stop();
    return switchPipe.reset();
  },
  reset: function () {
    switchPipe._streamIn1 = null;
    switchPipe._streamIn2 = null;
    switchPipe._streamOut = null;
    switchPipe._sink = null;
    switchPipe._stateIn1Out = null;
    return Date.now();
  }
};

// export module 'internal_switch-pipe'
module.exports = switchPipe;