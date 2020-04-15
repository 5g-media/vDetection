/**
 * @file Provides the module 'processing_OpenCV_draw-metadata'.
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
 * @module processing_OpenCV_draw-metadata
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

// define draw-metadata
const OutputSettingsImageResolutionWidth = parseInt(process.env.OUTPUT_SETTINGS_IMAGE_RESOLUTION_WIDTH, 10) || 1280;
const OutputSettingsImageResolutionHeight = parseInt(process.env.OUTPUT_SETTINGS_IMAGE_RESOLUTION_HEIGHT, 10) || 720;

/**
 * @constructs openCVDrawMetadata
 * @description constructs a metadata image drawer.
 * @todo environment
 * @param {Integer} _mat - the mat (image).
 * @param {Integer} _metadata - the metadata.
 * @param {Function} setMat - the setter function, sets the mat.
 * @param {Function} mat - the getter function, gets the mat.
 * @param {Function} setMetadata - the setter function, sets the metadata.
 * @param {Function} metadata - the getter function, gets the metadata.
 * @param {Function} process - the process function, draws rectangles and text onto an image (type of mat) if metadata contains objects.
 * @fires CV:MAT:drawRectangle
 * @fires CV:MAT:drawTextBox
 */
var openCVDrawMetadata = {
  _mat: new CV.Mat(OutputSettingsImageResolutionHeight, OutputSettingsImageResolutionWidth, CV.CV_8UC4, [0, 0, 0, 0]),
  _metadata: null,
  setMat: function (mat) {
    return openCVDrawMetadata._mat = mat;
  },
  mat: function () {
    return openCVDrawMetadata._mat;
  },
  setMetadata: function (metadata) {
    openCVDrawMetadata._metadata = metadata;
  },
  metadata: function () {
    return openCVDrawMetadata._metadata;
  },
  process: function (environment, metadata, mat) {
    var deferred = Q.defer();
    switch (environment.outputSettingsImageType()) {
      case 'png':
        openCVDrawMetadata.setMat(new CV.Mat(environment.outputSettingsImageResolutionHeight(), environment.outputSettingsImageResolutionWidth(), CV.CV_8UC4, [0, 0, 0, 0]));
        break;
      case 'jpg':
        openCVDrawMetadata.setMat(mat);
        break;
      default:
        break;
    }
    try {
      // if (environment.outputSettingsImageType() !== 'png' && mat) {
      //   openCVDrawMetadata.setMat(mat);
      // }
      if (metadata && metadata.hasOwnProperty('objects')) {
        openCVDrawMetadata.setMetadata(metadata);
        openCVDrawMetadata.metadata().objects.forEach(function (object, idx) {
          if (openCVDrawMetadata.metadata().numDetections[idx] > environment.processingDetectionConfidenceMin()) {
            openCVDrawMetadata.mat().drawRectangle(object, new CV.Vec3(environment.processingDrawLineColorR(), environment.processingDrawLineColorG(), environment.processingDrawLineColorB()), environment.processingDrawLineThickness(), CV.LINE_8);
            var textBox = [{
              text: 'confidence: ' + openCVDrawMetadata.metadata().numDetections[idx] / 100,
              fontSize: environment.processingDrawTextSize(),
              thickness: environment.processingDrawTextThickness(),
              color: new CV.Vec3(environment.processingDrawTextColorR(), environment.processingDrawTextColorG(), environment.processingDrawTextColorB())
            }];
            if (openCVDrawMetadata.metadata().hasOwnProperty('labels') && openCVDrawMetadata.metadata().labels[idx].confidence < environment.processingRecognitionDistanceMax()) {
              textBox.push({
                text: 'label: ' + openCVDrawMetadata.metadata().labels[idx].label,
                fontSize: environment.processingDrawTextSize(),
                thickness: environment.processingDrawTextThickness(),
                color: new CV.Vec3(environment.processingDrawTextColorR(), environment.processingDrawTextColorG(), environment.processingDrawTextColorB())
              });
              textBox.push({
                text: 'distance: ' + parseInt(openCVDrawMetadata.metadata().labels[idx].confidence, 10),
                fontSize: environment.processingDrawTextSize(),
                thickness: environment.processingDrawTextThickness(),
                color: new CV.Vec3(environment.processingDrawTextColorR(), environment.processingDrawTextColorG(), environment.processingDrawTextColorB())
              });
            }
            CV.drawTextBox(openCVDrawMetadata.mat(), {
              x: object.x,
              y: object.y + object.height
            }, textBox, environment.processingDrawTextBackgroundAlpha());
          }
          if (idx === openCVDrawMetadata.metadata().objects.length - 1) {
            deferred.resolve(openCVDrawMetadata.mat());
          }
        });
      } else {
        deferred.reject(openCVDrawMetadata.mat());
      }
    } catch (error) {
      deferred.reject(openCVDrawMetadata.mat());
    }
    return deferred.promise;
  }
};

// export module 'processing_OpenCV_draw-metadata'
module.exports = openCVDrawMetadata;