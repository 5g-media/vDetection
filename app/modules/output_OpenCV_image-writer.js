/**
 * @file Provides the module 'output_OpenCV_image-writer'.
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
 * @module output_OpenCV_image-writer
 * @requires node_modules:dotenv
 * @requires node_modules:opencv4nodejs
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const CV = require('opencv4nodejs');

/**
 * @constructs openCVImageWriter
 * @description constructs an image writer.
 * @param {Function} write - the writer function, writes an image into a local filesystem.
 * @fires CV:MAT:imwrite
 * @fires CV:MAT:release
 */
var openCVImageWriter = {
  write: function (environment, frameCounter, frame) {
    var path = environment.outputLocalImagePath() + environment.outputLocalImageFilename() + '.' + environment.outputLocalImageFileextension();
    CV.imwrite(path, frame);
    frame.release();
  }
};

// export module 'output_OpenCV_image-writer'
module.exports = openCVImageWriter;