/**
 * @file Provides the module 'face-detection'.
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
 * @module face-detection
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:path
 * @requires node_modules:face-api.js
 * @requires node_modules:tensorflow:tfjs-node
 * @requires node_modules:tensorflow:tfjs-node-gpu
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require('q');
const Path = require('path')
const FaceAPI = require('face-api.js');
// const TF = require('@tensorflow/tfjs-node');
const USE_GPU = JSON.parse(process.env.USE_GPU);
let TF = null
if (USE_GPU) {
  TF = require('@tensorflow/tfjs-node-gpu');
} else {
  TF = require('@tensorflow/tfjs-node');
}

// define settings for debug / development
const DEBUG = JSON.parse(process.env.DEBUG)
const LOG = DEBUG ? console.log : () => { }

// define settings for face-detection
const MODELS_PATH = Path.join(__dirname, '/models');
const CNN_MODEL = process.env.CNN_MODEL;
const MIN_CONFIDENCE = parseFloat(process.env.MIN_CONFIDENCE, 10);
const PROCESSING_TIMEOUT = JSON.parse(process.env.PROCESSING_TIMEOUT)
const USE_AGE_GENDER_EXPRESSIONS = JSON.parse(process.env.USE_AGE_GENDER_EXPRESSIONS)

/**
 * @constructs faceDetection
 * @description constructs a face-detector.
 * @param {Object} _minConfidence - the min confidence for face detection (0 - 1, 1 as 100%)
 * @param {Object} _tinyFaceDetector - the pre-trained TensorFlow Tiny Yolo V2 model (tinyFaceDetector) for face-api.js
 * @param {Object} _tinyFaceDetectorOptions - the options for the pre-trained TensorFlow Tiny Yolo V2 model for face-api.js
 * @param {Object} _ssdMobilenetv1 - the pre-trained TensorFlow SSD Mobilenet V1 model for face-api.js
 * @param {Object} _ssdMobilenetv1Options - the options for the pre-trained TensorFlow SSD Mobilenet V1 model for face-api.js
 * @param {Object} _ageGenderNet - the pre-trained Age Gender Net model for face-api.js
 * @param {Object} _faceExpressionNet - the pre-trained Face Expression Net model for face-api.js
 * @param {Function} init - the init function, loading several CNNs (Convolutional Neural Networks) to solve face-detection
 * @param {Function} process - the detection function, based on the frame (image/step)
 * @fires FaceAPI:loadFromDisk
 * @fires FaceAPI:detectAllFaces
 * @fires FaceAPI:withAgeAndGender
 * @fires FaceAPI:withFaceExpressions
 */
var faceDetection = {
  _minConfidence: 0.1,
  _tinyFaceDetector: null,
  _ssdMobilenetv1: null,
  _ssdMobilenetv1Options: null,
  _ageGenderNet: null,
  _faceExpressionNet: null,
  setMinConfidence: function (confidence) {
    this._minConfidence = confidence;
  },
  setTinyFaceDetector: function (data) {
    this._tinyFaceDetector = data;
  },
  setTinyFaceDetectorOptions: function (options) {
    this._tinyFaceDetectorOptions = options;
  },
  setMobileNet: function (data) {
    this._ssdMobilenetv1 = data;
  },
  setMobileNetOptions: function (options) {
    this._ssdMobilenetv1Options = options;
  },
  setAgeGenderNet: function (data) {
    this._ageGenderNet = data;
  },
  setFaceExpressionNet: function (data) {
    this._faceExpressionNet = data;
  },
  init: function () {
    try {
      var deferred = Q.defer();
      var deferred_tinyFaceDetector = Q.defer();
      var deferred_ssdMobilenetv1 = Q.defer();
      var deferred_ageGenderNet = Q.defer();
      var deferred_faceExpressionNet = Q.defer();
      var promiseChain = [
        deferred_tinyFaceDetector,
        deferred_ssdMobilenetv1,
        deferred_ageGenderNet,
        deferred_faceExpressionNet
      ];
      this.setMinConfidence(MIN_CONFIDENCE);
      if (this._tinyFaceDetector) {
        deferred_tinyFaceDetector.resolve();
      } else {
        FaceAPI.nets.tinyFaceDetector.loadFromDisk(MODELS_PATH).then((data) => {
          this.setTinyFaceDetector(FaceAPI.nets.tinyFaceDetector);
          this.setTinyFaceDetectorOptions(new FaceAPI.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: this._minConfidence
          }));
          LOG('[face-detection] tinyFaceDetector loading: success');
          deferred_tinyFaceDetector.resolve();
        }).catch(function (error) {
          LOG('[face-detection] tinyFaceDetector loading: error', error);
          deferred_tinyFaceDetector.reject(null);
        });
      }
      if (this._ssdMobilenetv1) {
        deferred_ssdMobilenetv1.resolve();
      } else {
        FaceAPI.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH).then((data) => {
          this.setMobileNet(FaceAPI.nets.ssdMobilenetv1);
          this.setMobileNetOptions(new FaceAPI.SsdMobilenetv1Options({
            minConfidence: this._minConfidence
          }));
          LOG('[face-detection] ssdMobilenetv1 loading: success');
          deferred_ssdMobilenetv1.resolve();
        }).catch(function (error) {
          LOG('[face-detection] ssdMobilenetv1 loading: error', error);
          deferred_ssdMobilenetv1.reject(null);
        });
      }
      if (this._ageGenderNet) {
        deferred_ageGenderNet.resolve();
      } else {
        FaceAPI.nets.ageGenderNet.loadFromDisk(MODELS_PATH).then((data) => {
          this.setAgeGenderNet(FaceAPI.nets.ageGenderNet);
          LOG('[face-detection] ageGenderNet loading: success');
          deferred_ageGenderNet.resolve();
        }).catch(function (error) {
          LOG('[face-detection] ageGenderNet loading: error', error);
          deferred_ageGenderNet.reject(null);
        });
      }
      if (this._faceExpressionNet) {
        deferred_faceExpressionNet.resolve();
      } else{
        FaceAPI.nets.faceExpressionNet.loadFromDisk(MODELS_PATH).then((data) => {
          this.setFaceExpressionNet(FaceAPI.nets.faceExpressionNet);
          LOG('[face-detection] faceExpressionNet loading: success');
          deferred_faceExpressionNet.resolve();
        }).catch(function (error) {
          LOG('[face-detection] faceExpressionNet loading: error', error);
          deferred_faceExpressionNet.reject(null);
        });
      }
      Q.all(promiseChain).then(function () {
        deferred.resolve()
      })
      return deferred.promise;
    } catch (error) {
      LOG('[face-detection] init: error', error);
    }
  },
  process: function (frame, maxTime, size) {
    try {
      var deferred = Q.defer();
      var maxTimeout = (PROCESSING_TIMEOUT) ? maxTime : 20000
      var timerID = setTimeout(function () {
        clearTimeout(timerID);
        LOG('[face-detection] detect timeout:', maxTimeout - 10);
        deferred.reject(null);
      }, maxTimeout - 10);
      if (frame) {
        switch (CNN_MODEL.toLowerCase()) {
          case 'ssdmobilenetv1':
            if (USE_AGE_GENDER_EXPRESSIONS) {
              FaceAPI.detectAllFaces(frame, this._ssdMobilenetv1Options)
                .withAgeAndGender()
                .withFaceExpressions()
                .then(function (data) {
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-detection] SSD Mobilenet V1 with age, gender and face expressions error:', error);
                  deferred.reject(error);
                });
            } else {
              FaceAPI.detectAllFaces(frame, this._ssdMobilenetv1Options)
                .then(function (data) {
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  // deferred.resolve(resizedDetections);
                  let transformedDetections = resizedDetections.map(resizedDetection => {
                    return {
                      'detection': resizedDetection
                    }
                  });
                  deferred.resolve(transformedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-detection] SSD Mobilenet V1 error:', error);
                  deferred.reject(error);
                });
            }
            break;
          case 'tinyyolov2':
            // @see: https://github.com/justadudewhohacks/face-api.js/issues/377
            // FaceAPI.nets.tinyFaceDetector.detect(frame, this._tinyFaceDetectorOptions)
            if (USE_AGE_GENDER_EXPRESSIONS) {
              FaceAPI.detectAllFaces(frame, this._tinyFaceDetectorOptions)
                .withAgeAndGender()  
                .withFaceExpressions()
                .then(function (data) {
                  // @see: https://github.com/justadudewhohacks/face-api.js/issues/483
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-detection] Tiny Yolo V2 with age, gender and face expressions error:', error);
                  deferred.reject(error);
                });
            } else {
              FaceAPI.detectAllFaces(frame, this._tinyFaceDetectorOptions)
                .then(function (data) {
                  // @see: https://github.com/justadudewhohacks/face-api.js/issues/483
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  // deferred.resolve(resizedDetections);
                  let transformedDetections = resizedDetections.map(resizedDetection => {
                    return {
                      'detection': resizedDetection
                    }
                  });
                  deferred.resolve(transformedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-detection] Tiny Yolo V2 error:', error);
                  deferred.reject(error);
                });
            }
            break;
          default:
            LOG('[face-detection] CNN model not supported:', CNN_MODEL);
            break;
        }
      } else {
        clearTimeout(timerID);
        deferred.reject(null);
      }
    } catch (error) {
      LOG('[face-detection] detect error:', error);
    }
    return deferred.promise;
  }
};

// export module 'face-detection'
module.exports = faceDetection;