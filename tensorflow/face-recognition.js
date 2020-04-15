/**
 * @file Provides the module 'face-recognition'.
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
 * @module face-recognition
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:path
 * @requires node_modules:fs
 * @requires node_modules:face-api.js
 * @requires node_modules:node-fetch
 * @requires node_modules:tensorflow:tfjs-node
 * @requires node_modules:tensorflow:tfjs-node-gpu
 * @requires node_modules:base64-to-uint8array
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require('q');
const Path = require('path');
const Fs = require('fs');
const FaceAPI = require('face-api.js');
const Fetch = require('node-fetch');
FaceAPI.env.monkeyPatch({ fetch: Fetch });
// const TF = require('@tensorflow/tfjs-node');
const USE_GPU = JSON.parse(process.env.USE_GPU);
let TF = null
if (USE_GPU) {
  TF = require('@tensorflow/tfjs-node-gpu');
} else {
  TF = require('@tensorflow/tfjs-node');
}

const toUint8Array = require('base64-to-uint8array');

// define settings for debug / development
const DEBUG = JSON.parse(process.env.DEBUG)
const LOG = DEBUG ? console.log : () => { }

// define settings for face-recognition
const MODELS_PATH = Path.join(__dirname, '/models');
const CNN_MODEL = process.env.CNN_MODEL;
const MIN_CONFIDENCE = parseFloat(process.env.MIN_CONFIDENCE, 10);
const MAX_DESCRIPTOR_DISTANCE = parseFloat(process.env.MAX_DESCRIPTOR_DISTANCE, 10);
const PROCESSING_TIMEOUT = JSON.parse(process.env.PROCESSING_TIMEOUT)
const USE_AGE_GENDER_EXPRESSIONS = JSON.parse(process.env.USE_AGE_GENDER_EXPRESSIONS)

const ASSETS_PATH = Path.resolve('assets');
const ASSETS_FILES = Fs.readdirSync(ASSETS_PATH);

/**
 * @constructs faceRecognition
 * @description constructs a face-detector.
 * @param {Object} _minConfidence - the min confidence for face recognition (0 - 1, 1 as 100%)
 * @param {Object} _maxDescriptorDistance - the max distance for face recognition (0 - infinite, 0 as best/closest)
 * @param {Object} _tinyFaceDetector - the pre-trained TensorFlow Tiny Yolo V2 model (tinyFaceDetector) for face-api.js
 * @param {Object} _tinyFaceDetectorOptions - the options for the pre-trained TensorFlow Tiny Yolo V2 model for face-api.js
 * @param {Object} _ssdMobilenetv1 - the pre-trained TensorFlow SSD Mobilenet V1 model for face-api.js
 * @param {Object} _ssdMobilenetv1Options - the options for the pre-trained TensorFlow SSD Mobilenet V1 model for face-api.js
 * @param {Object} _ageGenderNet - the pre-trained Age Gender Net model for face-api.js
 * @param {Object} _faceExpressionNet - the pre-trained Face Expression Net model for face-api.js
 * @param {Object} _faceRecognitionNet - the pre-trained Face Recognition Net model for face-api.js
 * @param {Object} _labeledFaceDescriptors - the face descriptors of all detected faces in loaded images within folder assets
 * @param {Object} _faceMatcher - the pre-trained Face Matcher based on _labeledFaceDescriptors
 * @param {Function} init - the init function, loading several CNNs (Convolutional Neural Networks) to solve face-recognition
 * @param {Function} process - the recognition function, based on the frame (image/step)
 * @fires FaceAPI:loadFromDisk
 * @fires FaceAPI:detectAllFaces
 * @fires FaceAPI:withFaceLandmarks
 * @fires FaceAPI:withFaceDescriptor
 * @fires FaceAPI:withAgeAndGender
 * @fires FaceAPI:withFaceExpressions
 */
var faceRecognition = {
  _minConfidence: 0.1,
  _maxDescriptorDistance: 0.6,
  _tinyFaceDetector: null,
  _ssdMobilenetv1: null,
  _ssdMobilenetv1Options: null,
  _ageGenderNet: null,
  _faceExpressionNet: null,
  _faceRecognitionNet: null,
  _labeledFaceDescriptors: null,
  _faceMatcher: null,
  setMinConfidence: function (confidence) {
    this._minConfidence = confidence;
  },
  setMaxDescriptorDistance: function (distance) {
    this._maxDescriptorDistance = distance;
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
  setFaceRecognitionNet: function (data) {
    this._faceRecognitionNet = data;
  },
  setLabeledFaceDescriptors: function (data) {
    this._labeledFaceDescriptors = data;
  },
  setFaceMatcher: function (data) {
    this._faceMatcher = data;
  },
  init: function () {
    try {
      var deferred = Q.defer();
      var deferred_tinyFaceDetector = Q.defer();
      var deferred_ssdMobilenetv1 = Q.defer();
      var deferred_ageGenderNet = Q.defer();
      var deferred_faceExpressionNet = Q.defer();
      var deferred_faceRecognitionNet = Q.defer();
      var deferred_labeledFaceDescriptors = Q.defer();
      var deferred_faceMatcher = Q.defer();
      var promiseChain = [
        deferred_tinyFaceDetector,
        deferred_ssdMobilenetv1,
        deferred_ageGenderNet,
        deferred_faceExpressionNet,
        deferred_faceRecognitionNet,
        deferred_labeledFaceDescriptors,
        deferred_faceMatcher,
      ];
      this.setMinConfidence(MIN_CONFIDENCE);
      this.setMaxDescriptorDistance(MAX_DESCRIPTOR_DISTANCE)
      if (this._tinyFaceDetector) {
        deferred_tinyFaceDetector.resolve();
      } else {
        FaceAPI.nets.tinyFaceDetector.loadFromDisk(MODELS_PATH).then((data) => {
          this.setTinyFaceDetector(FaceAPI.nets.tinyFaceDetector);
          this.setTinyFaceDetectorOptions(new FaceAPI.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: this._minConfidence
          }));
          LOG('[face-recognition] tinyFaceDetector loading: success');
          deferred_tinyFaceDetector.resolve();
        }).catch(function (error) {
          LOG('[face-recognition] tinyFaceDetector loading: error', error);
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
          LOG('[face-recognition] ssdMobilenetv1 loading: success');
          deferred_ssdMobilenetv1.resolve();
        }).catch(function (error) {
          LOG('[face-recognition] ssdMobilenetv1 loading: error', error);
          deferred_ssdMobilenetv1.reject(null);
        });
      }
      if (this._ageGenderNet) {
        deferred_ageGenderNet.resolve();
      } else {
        FaceAPI.nets.ageGenderNet.loadFromDisk(MODELS_PATH).then((data) => {
          this.setAgeGenderNet(FaceAPI.nets.ageGenderNet);
          LOG('[face-recognition] ageGenderNet loading: success');
          deferred_ageGenderNet.resolve();
        }).catch(function (error) {
          LOG('[face-recognition] ageGenderNet loading: error', error);
          deferred_ageGenderNet.reject(null);
        });
      }
      if (this._faceExpressionNet) {
        deferred_faceExpressionNet.resolve();
      } else{
        FaceAPI.nets.faceExpressionNet.loadFromDisk(MODELS_PATH).then((data) => {
          this.setFaceExpressionNet(FaceAPI.nets.faceExpressionNet);
          LOG('[face-recognition] faceExpressionNet loading: success');
          deferred_faceExpressionNet.resolve();
        }).catch(function (error) {
          LOG('[face-recognition] faceExpressionNet loading: error', error);
          deferred_faceExpressionNet.reject(null);
        });
      }
      if (this._faceRecognitionNet) {
        deferred_faceRecognitionNet.resolve();
      } else {
        FaceAPI.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH).then((data) => {
          this.setFaceExpressionNet(FaceAPI.nets.faceRecognitionNet);
          LOG('[face-recognition] faceRecognitionNet loading: success');
          deferred_faceRecognitionNet.resolve();
        }).catch(function (error) {
          LOG('[face-recognition] faceRecognitionNet loading: error', error);
          deferred_faceRecognitionNet.reject(null);
        });
      }
      if (this._labeledFaceDescriptors) {
        deferred_labeledFaceDescriptors.resolve();
      } else {
        let indexedDescriptors = {};
        FaceAPI.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH).then((data) => {
          FaceAPI.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH).then((data) => {
            Promise.all(
              ASSETS_FILES.map(async (file, index) => {
                const LABEL = file.split('.')[0].replace(/[^A-Za-z]/g, '');
                if (!indexedDescriptors.hasOwnProperty(LABEL)) {
                  indexedDescriptors[LABEL] = [];
                }
                const FILE_PATH = Path.resolve(ASSETS_PATH, file);
                const DATA = Fs.readFileSync(FILE_PATH);
                const BufferedData = Buffer.from(DATA, 'base64');
                const ImageArray = toUint8Array(BufferedData);
                const Tensor3d = TF.node.decodePng(ImageArray, 3);
                const fullFaceDescription = await FaceAPI.detectSingleFace(Tensor3d, new FaceAPI.SsdMobilenetv1Options({
                  minConfidence: this._minConfidence
                }))
                .withFaceLandmarks()
                .withFaceDescriptor()
                if (
                  fullFaceDescription &&
                  fullFaceDescription.hasOwnProperty('descriptor')
                ) {
                  indexedDescriptors[LABEL].push(fullFaceDescription.descriptor);
                  LOG('[face-recognition] labeledFaceDescriptors: ', `success detecting faces for ${LABEL}`);
                } else {
                  LOG('[face-recognition] labeledFaceDescriptors: ', `error detecting faces for ${file}`);
                }
              })
            ).then((data) => {
              let labeledDescriptors = []
              Object.keys(indexedDescriptors).forEach((key, index) => {
                if (indexedDescriptors[key].length > 0) {
                  labeledDescriptors.push(new FaceAPI.LabeledFaceDescriptors(
                    key,
                    indexedDescriptors[key]
                  ));
                } else {
                  LOG('[face-recognition] labeledFaceDescriptors: ', `filtering ${key}`);
                }
              });
              this.setLabeledFaceDescriptors(labeledDescriptors);
              LOG('[face-recognition] labeledFaceDescriptors loading: success');
              const FaceMatcher = new FaceAPI.FaceMatcher(labeledDescriptors, this._maxDescriptorDistance)
              this.setFaceMatcher(FaceMatcher);
              LOG('[face-recognition] faceMatcher loading: success');
              deferred_labeledFaceDescriptors.resolve();
            }).catch((error) => {
              LOG('[face-recognition] labeledFaceDescriptors loading: error', error);
              deferred_labeledFaceDescriptors.reject(null);
            })
          })
        })
      }
      Q.all(promiseChain).then(function () {
        deferred.resolve()
      })
      return deferred.promise;
    } catch (error) {
      LOG('[face-recognition] init: error', error);
    }
  },
  process: function (frame, maxTime, size) {
    try {
      var deferred = Q.defer();
      var that = this;
      var maxTimeout = (PROCESSING_TIMEOUT) ? maxTime : 20000
      var timerID = setTimeout(function () {
        clearTimeout(timerID);
        LOG('[face-recognition] detect timeout:', maxTimeout - 10);
        deferred.reject(null);
      }, maxTimeout - 10);
      if (frame) {
        switch (CNN_MODEL.toLowerCase()) {
          case 'ssdmobilenetv1':
            if (USE_AGE_GENDER_EXPRESSIONS) {
              FaceAPI.detectAllFaces(frame, this._ssdMobilenetv1Options)
                .withFaceLandmarks()
                .withFaceDescriptors()
                .withAgeAndGender()
                .withFaceExpressions()
                .then(data => {
                  if (
                    data &&
                    data.length > 0
                  ) {
                    const results = data.map(fd => this._faceMatcher.findBestMatch(fd.descriptor))
                    results.forEach((bestMatch, i) => {
                      data[i].bestMatch = bestMatch
                    })
                  }
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-recognition] SSD Mobilenet V1 with age, gender and face expressions error:', error);
                  deferred.reject(error);
                });
            } else {
              FaceAPI.detectAllFaces(frame, this._ssdMobilenetv1Options)
                .withFaceLandmarks()
                .withFaceDescriptors()
                .then(data => {
                  if (
                    data &&
                    data.length > 0
                  ) {
                    const results = data.map(fd => this._faceMatcher.findBestMatch(fd.descriptor))
                    results.forEach((bestMatch, i) => {
                      data[i].bestMatch = bestMatch
                    })
                  }
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-recognition] SSD Mobilenet V1 error:', error);
                  deferred.reject(error);
                });
            }
            break;
          case 'tinyyolov2':
            // @see: https://github.com/justadudewhohacks/face-api.js/issues/377
            // FaceAPI.nets.tinyFaceDetector.detect(frame, this._tinyFaceDetectorOptions)
            if (USE_AGE_GENDER_EXPRESSIONS) {
              FaceAPI.detectAllFaces(frame, this._tinyFaceDetectorOptions)
                .withFaceLandmarks()
                .withFaceDescriptors()
                .withAgeAndGender()  
                .withFaceExpressions()
                .then(data => {
                  if (
                    data &&
                    data.length > 0
                  ) {
                    const results = data.map(fd => this._faceMatcher.findBestMatch(fd.descriptor))
                    results.forEach((bestMatch, i) => {
                      data[i].bestMatch = bestMatch
                    })
                  }
                  // @see: https://github.com/justadudewhohacks/face-api.js/issues/483
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-recognition] Tiny Yolo V2 with age, gender and face expressions error:', error);
                  deferred.reject(error);
                });
            } else {
              FaceAPI.detectAllFaces(frame, this._tinyFaceDetectorOptions)
                .withFaceLandmarks()
                .withFaceDescriptors()
                .then(data => {
                  if (
                    data &&
                    data.length > 0
                  ) {
                    const results = data.map(fd => this._faceMatcher.findBestMatch(fd.descriptor))
                    results.forEach((bestMatch, i) => {
                      data[i].bestMatch = bestMatch
                    })
                  }
                  // @see: https://github.com/justadudewhohacks/face-api.js/issues/483
                  const resizedDetections = FaceAPI.resizeResults(data, size);
                  clearTimeout(timerID);
                  frame.dispose();
                  deferred.resolve(resizedDetections);
                }).catch(function (error) {
                  clearTimeout(timerID);
                  LOG('[face-recognition] Tiny Yolo V2 error:', error);
                  deferred.reject(error);
                });
            }
            break;
          default:
            LOG('[face-recognition] CNN model not supported:', CNN_MODEL);
            break;
        }
      } else {
        clearTimeout(timerID);
        deferred.reject(null);
      }
    } catch (error) {
      LOG('[face-recognition] detect error:', error);
    }
    return deferred.promise;
  }
};

// export module 'face-recognition'
module.exports = faceRecognition;