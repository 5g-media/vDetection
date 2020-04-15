/**
 * @file Provides the module 'processing_OpenCV_face-detection'.
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
 * @module processing_OpenCV_face-detection
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:opencv4nodejs
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const CV = require('opencv4nodejs');

// define settings for face-detection
const ProcessingDetectionCascadeClassifierTypes = process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_ENUM_TYPES.toUpperCase().split(',');
const ProcessingDetectionCascadeClassifierType = (ProcessingDetectionCascadeClassifierTypes.indexOf(process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase()) > -1) ? process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase() : 'HAAR_FRONTALFACE_ALT2';
const Classifier = new CV.CascadeClassifier(CV[ProcessingDetectionCascadeClassifierType]);

/**
 * @constructs openCVFaceDetection
 * @description constructs a face detector.
 * @param {Function} detect - the detection function, based on the id of the frame (image/step), the frame (image/step), and the maxTime befor rejecting the promise
 * @fires CV:MAT:copy
 * @fires CV:MAT:resizeToMax
 * @fires CV:MAT:bgrToGray
 * @fires CV:MAT:release
 * @fires CV:VEC:rescale
 * @fires Classifier:detectMultiScaleAsync
 */
var openCVFaceDetection = {
  detect: function (environment, id, frame, maxTime) {
    var deferred = Q.defer();
    var timerID = setTimeout(function () {
      clearTimeout(timerID);
      deferred.reject(null);
    }, maxTime - 20);
    if (frame) {
      var mat = frame.copy().resizeToMax(320).bgrToGray();
      var factor = frame.rows / mat.rows;
      Classifier.detectMultiScaleAsync(mat).then(function (result) {
        if (!result.objects.length) {
          mat.release();
          clearTimeout(timerID);
          deferred.reject(null);
        } else {
          result.objects.forEach(function (object, idx) {
            result.objects[idx] = object.rescale(factor);
            if (idx === result.objects.length - 1) {
              mat.release();
              clearTimeout(timerID);
              deferred.resolve(result);
            }
          });
        }
      });
    } else {
      clearTimeout(timerID);
      deferred.reject(null);
    }
    return deferred.promise;
  }
};

// export module 'processing_OpenCV_face-detection'
module.exports = openCVFaceDetection;