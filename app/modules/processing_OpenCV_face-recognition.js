/**
 * @file Provides the module 'processing_OpenCV_face-recognition'.
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
 * @module processing_OpenCV_face-recognition
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:opencv4nodejs
 * @requires modules:fs
 * @requires modules:path
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const CV = require('opencv4nodejs');
const Fs = require('fs');
const Path = require('path');

// check OpenCV is compiled with OpenCV extra modules (specific face)
if (!CV.xmodules.face) {
  throw new Error('exiting: OpenCV compiled without OpenCV extra modules: face module');
}

// define settings for face-detection
const ProcessingDetectionCascadeClassifierTypes = process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_ENUM_TYPES.toUpperCase().split(',');
const ProcessingDetectionCascadeClassifierType = (ProcessingDetectionCascadeClassifierTypes.indexOf(process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase()) > -1) ? process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase() : 'HAAR_FRONTALFACE_ALT2';
const Classifier = new CV.CascadeClassifier(CV[ProcessingDetectionCascadeClassifierType]);

// define settings for face-recognition
const ProcessingRecognitionAssetsPath = process.env.PROCESSING_RECOGNITION_ASSETS_PATH || 'assets/image';
const ProcessingRecognitionAssetsFileTypes = process.env.PROCESSING_RECOGNITION_ASSETS_FILE_ENUM_TYPES.toLowerCase().split(',');
const ProcessingRecognitionAssetsFileType = (ProcessingRecognitionAssetsFileTypes.indexOf(process.env.PROCESSING_RECOGNITION_ASSETS_FILE_TYPE.toLowerCase()) > -1) ? process.env.PROCESSING_RECOGNITION_ASSETS_FILE_TYPE.toLowerCase() : 'jpg';
const ImgsPath = Path.resolve(ProcessingRecognitionAssetsPath, ProcessingRecognitionAssetsFileType);
const ImgFiles = Fs.readdirSync(ImgsPath);

/**
 * @function distinct
 * @description Defines a filter-function creating a distinct list of values.
 * @param {Object} value - the value to distinct
 * @param {Integer} index - the index position
 * @param {Object[]} self - the array to distinct
 * @returns {Boolean}
 */
const distinct = function (value, index, self) {
  return self.indexOf(value) === index;
}

/**
 * @constructs NameMappings
 * @description constructs a list of labels.
 * @param {Array} Images - the list of Images, based on initial list of images as gray images
 * @returns {Array}
 */
// const NameMappings = process.env.PROCESSING_RECOGNITION_ASSETS_LABELS.toLowerCase().split(',');
const NameMappings = ImgFiles
  .map(function (file) {
    return file.split('.')[0].replace(/[^A-Za-z]/g, '');
  }).filter(distinct);

/**
 * @function getFaceImage
 * @description Returns an image of a detected face.
 * @param {Object} grayImg - the initial image as gray image
 * @returns {Object}
 * @fires Classifier:detectMultiScale
 * @fires CV:MAT:getRegion
 */
const getFaceImage = function (grayImg) {
  const recognitions = Classifier.detectMultiScale(grayImg).objects;
  if (!recognitions.length) {
    return grayImg;
  } else {
    return grayImg.getRegion(recognitions[0]);
  }
};

/**
 * @constructs Images
 * @description constructs a list of images of detected faces.
 * @param {Array} Images - the list of Images, based on initial list of images as gray images
 * @fires Path:resolve
 * @fires CV:MAT:imread
 * @fires CV:MAT:bgrToGray
 * @fires CV:MAT:resize
 */
const Images = ImgFiles
  .map(function (file) {
    return Path.resolve(ImgsPath, file);
  })
  .map(function (filePath) {
    return CV.imread(filePath);
  })
  .map(function (img) {
    return img.bgrToGray();
  })
  .map(function (grayImg) {
    return getFaceImage(grayImg);
  })
  .map(function (faceImg) {
    if (faceImg) {
      return faceImg.resize(80, 80);
    } else {
      console.log('no faceImg');
    }
  });

/**
 * @constructs Labels
 * @description constructs a list of labels.
 * @param {Array} Labels - the list of Labels, based on images as gray images with filenames as labels if listed in NameMappings
 */
const Labels = ImgFiles
  .map(function (file) {
    return NameMappings.findIndex(function (name) {
      return file.includes(name);
    });
  });

/**
 * @constructs LBPH
 * @description constructs the training set for the face recognizer.
 * @param {Object} LBPH - the training set, based on a list of images and labels
 * @fires LBPH:train
 */
const LBPH = new CV.LBPHFaceRecognizer();
LBPH.train(Images, Labels);

/**
 * @constructs openCVFaceRecognition
 * @description constructs a face recognizer.
 * @param {Function} recognize - the recognition function, based on the id of the frame (image/step), the frame (image/step), and the maxTime befor rejecting the promise
 * @fires CV:MAT:copy
 * @fires CV:MAT:resizeToMax
 * @fires CV:MAT:bgrToGray
 * @fires CV:MAT:release
 * @fires CV:MAT:getRegion
 * @fires CV:VEC:rescale
 * @fires LBPH:predict
 * @fires Classifier:detectMultiScaleAsync
 */
var openCVFaceRecognition = {
  recognize: function (environment, id, frame, maxTime) {
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
          result.labels = [];
          result.objects.forEach(function (object, idx) {
            const faceImg = mat.getRegion(object);
            const faceRecognition = LBPH.predict(faceImg);
            result.labels[idx] = (faceRecognition) ? faceRecognition : null;
            result.labels[idx].label = NameMappings[result.labels[idx].label];
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

// export module 'processing_OpenCV_face-recognition'
module.exports = openCVFaceRecognition;