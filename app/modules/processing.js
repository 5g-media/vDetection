/**
 * @file Provides the module 'processing'.
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
 * @module processing
 * @requires node_modules:dotenv
 * @requires node_modules:opencv4nodejs
 * @requires node_modules:pipe2jpeg
 * @requires node_modules:q
 * @requires node_modules:stream
 * @requires modules:output
 * @requires modules:processing_OpenCV_face-detection
 * @requires modules:processing_OpenCV_face-recognition
 * @requires modules:processing_OpenCV_draw-metadata
 * @requires modules:switch-pipe
 * @requires modules:synchronization
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const CV = require('opencv4nodejs');
const P2J = require('pipe2jpeg');
const {
  PassThrough
} = require('stream');
// const SwitchPipe = require('./internal_switch-pipe');
const POCVFD = require('./processing_OpenCV_face-detection');
const POCVFR = require('./processing_OpenCV_face-recognition');
const POCVDM = require('./processing_OpenCV_draw-metadata');
const Output = require('./output');
const Synchronization = require('./synchronization');

// prepare variables for output (sync)
var cmd = {
  data: 1,
  error: 2,
  debug: 3,
  status: 4,
  config: 5
};

/**
 * @function getMessage
 * @description Returns an object for message.
 * @param {String} id - the id of the message
 * @param {Array} detections - the list of found detections
 * @param {Array} confidences - the list of corresponding conficences to the detections
 * @param {Array} labels - the list of labels for the detections
 * @returns {Object}
 */
var getMessage = function (id, detections, confidences, labels) {
  var message = {
    id: id,
    frame: id,
    objects: [],
    timestamp: Date.now()
  };
  if (detections) {
    detections.forEach(function (obj, i) {
      obj.confidence = parseInt(confidences[i], 10) / 100;
      if (labels) {
        obj.label = labels[i];
      }
      message.objects.push(obj);
    });
  }
  return message;
};

/**
 * @function getSyncPayload
 * @description Returns an object (response body) for synchronization.
 * @param {Integer} payloadCmd - the command code
 * @param {String} payloadMsg - the message
 * @returns {Object}
 */
var getSyncPayload = function (payloadCmd, payloadMsg) {
  var payload = {};
  payload.cmd = payloadCmd;
  payload.msg = payloadMsg;
  return payload;
};

/**
 * @constructs Processing
 * @description constructs a processing object.
 * @param {Object} _client - the client.
 * @param {Object} _stream - the stream.
 * @param {Object} _passThroughStream - the passThroughStream.
 * @param {Integer} _interval - the interval.
 * @param {Integer} _frameCounter - the frameCounter.
 * @param {Function} setClient - the setter function, sets the client.
 * @param {Function} client - the getter function, gets the client.
 * @param {Function} setStream - the setter function, sets the stream.
 * @param {Function} stream - the getter function, gets the stream.
 * @param {Function} setPassThroughStream - the setter function, sets the passThroughStream.
 * @param {Function} passThroughStream - the getter function, gets the passThroughStream.
 * @param {Function} setInterval - the setter function, sets the interval.
 * @param {Function} interval - the getter function, gets the interval.
 * @param {Function} setFrameCounter - the setter function, sets the frameCounter.
 * @param {Function} frameCounter - the getter function, gets the frameCounter.
 * @param {Function} process - the process function.
 * @param {Function} step - the step function.
 * @param {Function} sync - the sync function.
 * @param {Function} stop - the stop function.
 * @param {Function} reset - the reset function.
 * @fires CV:imdecode
 * @fires CV:MAT:release
 * @fires Synchronization.sync
 * @fires SwitchPipe.addStream
 * @fires POCVFD.detect
 * @fires POCVFR.recognize
 * @fires POCVDM.process
 * @fires Output.init
 * @fires Output.step
 */
var Processing = {
  _client: null,
  _stream: null,
  _passThroughStream: null,
  _interval: null,
  _frameCounter: null,
  setClient: function () {
    return Processing._client = new P2J();
  },
  client: function () {
    return Processing._client;
  },
  setPassThroughStream: function () {
    Processing._passThroughStream = new PassThrough();
  },
  passThroughStream: function () {
    return Processing._passThroughStream;
  },
  setInterval: function (fps) {
    Processing._interval = 1000 / fps;
  },
  interval: function () {
    return Processing._interval;
  },
  setFrameCounter: function (frameCounter) {
    return Processing._frameCounter = frameCounter;
  },
  frameCounter: function () {
    return Processing._frameCounter;
  },
  setStream: function (environment, SwitchPipe) {
    var spawnFlag = true;
    var outputFlag = true;
    var frameCounter = Processing.setFrameCounter(0);
    Processing.setPassThroughStream();
    Processing.setInterval(environment.processingSettingsFps());
    Processing.setClient();
    return Processing._stream = Processing.client().on('jpeg', function (data) {
      const BufferedData = Buffer.from(data, 'base64');
      const Frame = CV.imdecode(BufferedData);
      if (spawnFlag) {
        Synchronization.sync('spawnSuccess', 'spawnSuccess');
        spawnFlag = false;
      }
      if (outputFlag) {
        Output.init(Processing.passThroughStream(), environment);
        SwitchPipe.addStream(Processing.passThroughStream());
        outputFlag = false;
      }
      Processing.setFrameCounter(++frameCounter);
      Processing.process(environment, Processing.frameCounter(), Frame, Processing.interval());
    });
  },
  stream: function () {
    return Processing._stream;
  },
  process: function (environment, frameCounter, frame, interval) {
    switch (environment.processingSettingsType()) {
      case 'face-detection':
        POCVFD.detect(environment, frameCounter, frame, interval)
          .then(function (data) {
            try {
              Processing.step(environment, frameCounter, frame, data);
            } catch (error) {
              frame.release();
            }
          })
          .catch(function (error) {
            Processing.step(environment, frameCounter, frame, null);
          });
        break;
      case 'face-recognition':
        POCVFR.recognize(environment, frameCounter, frame, interval)
          .then(function (data) {
            try {
              Processing.step(environment, frameCounter, frame, data);
            } catch (error) {
              frame.release();
            }
          })
          .catch(function (error) {
            Processing.step(environment, frameCounter, frame, null);
          });
        break;
      default:
        break;
    }
  },
  step: function (environment, frameCounter, frame, metadata) {
    Processing.sync(environment, frameCounter, metadata);
    POCVDM.process(environment, metadata, frame)
      .then(function (data) {
        try {
          Output.step(environment, frameCounter, data);
        } catch (error) {
          Output.step(environment, frameCounter, frame);
          frame.release();
        }
      })
      .catch(function (error) {
        Output.step(environment, frameCounter, error);
      });
  },
  sync: function (environment, frameCounter, metadata) {
    if (environment.outputSyncUse()) {
      var detections = (metadata && metadata.hasOwnProperty('objects')) ? metadata.objects : [];
      var confidences = (metadata && metadata.hasOwnProperty('numDetections')) ? metadata.numDetections : [];
      var labels = (metadata && metadata.hasOwnProperty('labels')) ? metadata.labels : [];
      Synchronization.sync(getSyncPayload(cmd.data, getMessage(frameCounter, detections, confidences, labels)))
        .then(function (data) {})
        .catch(function (error) {});
    } else {}
  },
  stop: function (environment) {
    Output.stop(environment);
    return Processing.reset();
  },
  reset: function () {
    Processing._client = null;
    Processing._stream = null;
    Processing._passThroughStream = null;
    Processing._interval = null;
    Processing._frameCounter = null;
    return Date.now();
  }
};

// export module 'processing'
module.exports = Processing;