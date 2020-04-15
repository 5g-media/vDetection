/**
 * @file Provides the module 'vDetection'.
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
 * @module vDetection
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires modules:fs
 * @requires modules:path
 * @requires modules:input_FFmpeg
 * @requires modules:output_FFmpeg
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const Fs = require('fs');
const Path = require('path');
const Input = require('./input_FFmpeg');
const Output = require('./output_FFmpeg');

// prepare variables for input synchronization
const InputSyncUse = (process.env.INPUT_SYNC_USE.toLowerCase() == 'true') || false;
const InputSyncPROT = process.env.INPUT_SYNC_PROT || 'http';
const InputSyncHOST = process.env.INPUT_SYNC_HOST || 'localhost';
const InputSyncPORT = parseInt(process.env.INPUT_SYNC_PORT, 10) || 3145;
const InputSyncBASE = process.env.INPUT_SYNC_BASE || '';
const InputSyncURL = InputSyncPROT + '://' + InputSyncHOST + ':' + InputSyncPORT + InputSyncBASE;
const InputSyncNAME = process.env.INPUT_SYNC_NAME || 'detection';

// prepare settings for input
const InputSettingsLogLevels = process.env.INPUT_SETTINGS_LOG_LEVEL_ENUM.toLowerCase().split(',');
const InputSettingsLogLevel = (InputSettingsLogLevels.indexOf(process.env.INPUT_SETTINGS_LOG_LEVEL.toLowerCase()) > -1) ? process.env.INPUT_SETTINGS_LOG_LEVEL.toLowerCase() : 'warning';
const InputSettingsFPS = parseInt(process.env.INPUT_SETTINGS_FPS, 10) || 25;
const InputSettingsScaleUse = (process.env.INPUT_SETTINGS_SCALE_USE.toLowerCase() == 'true') || false;
const InputSettingsScaleWidth = parseInt(process.env.INPUT_SETTINGS_SCALE_WIDTH, 10) || -1;
const InputSettingsScaleHeight = parseInt(process.env.INPUT_SETTINGS_SCALE_HEIGHT, 10) || 1080;

// prepare variables for input video via stream
const InputSourcePROT = process.env.INPUT_STREAM_SOURCE_PROT || 'rtmp';
const InputSourceHOST = process.env.INPUT_STREAM_SOURCE_HOST || 'localhost';
const InputSourcePORT = parseInt(process.env.INPUT_STREAM_SOURCE_PORT, 10) || 1935;
const InputSourceBASE = process.env.INPUT_STREAM_SOURCE_BASE || '/live/demo';
const InputSourceURL = InputSourcePROT + '://' + InputSourceHOST + ':' + InputSourcePORT + InputSourceBASE;

// prepare variables for input data (video/images) via stream (pipe)
const InputSourcePipePORT = process.env.INPUT_PIPE_SOURCE_PORT || 0;

// prepare variables for interal video via serve
const InternalServeUse = (process.env.INTERNAL_SERVE_USE.toLowerCase() == 'true') || false;
const InternalServePROT = process.env.INTERNAL_SERVE_PROT || 'http';
const InternalServeHOST = process.env.INTERNAL_SERVE_HOST || 'localhost';
const InternalServePORT = parseInt(process.env.INTERNAL_SERVE_PORT, 10) || 5001;
const InternalServeBASE = process.env.INTERNAL_SERVE_BASE || '';
const InternalServeURL = InternalServePROT + '://' + InternalServeHOST + ':' + InternalServePORT + InternalServeBASE;

// prepare settings for processing
const ProcessingSettingsTypes = process.env.PROCESSING_SETTINGS_ENUM_TYPES.toLowerCase().split(',');
const ProcessingSettingsType = (ProcessingSettingsTypes.indexOf(process.env.PROCESSING_SETTINGS_TYPE.toLowerCase()) > -1) ? process.env.PROCESSING_SETTINGS_TYPE.toLowerCase() : 'face-detection';
const ProcessingSettingsFpsTypes = process.env.PROCESSING_SETTINGS_ENUM_FPS.split(',');
const ProcessingSettingsFps = parseInt(process.env.PROCESSING_SETTINGS_FPS, 10) || 1;

// prepare settings for processing face-detection
const ProcessingDetectionCascadeClassifierTypes = process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_ENUM_TYPES.toUpperCase().split(',');
const ProcessingDetectionCascadeClassifierType = (ProcessingDetectionCascadeClassifierTypes.indexOf(process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase()) > -1) ? process.env.PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE.toUpperCase() : 'HAAR_FRONTALFACE_ALT2';
const ProcessingDetectionConfidenceMin = parseInt(process.env.PROCESSING_DETECTION_CONFIDENCE_MIN, 10) || 20;

// prepare settings for processing face-recognition
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
const ProcessingRecognitionDistanceMax = parseInt(process.env.PROCESSING_RECOGNITION_DISTANCE_MAX, 10) || 200;
const ProcessingRecognitionAssetsPath = process.env.PROCESSING_RECOGNITION_ASSETS_PATH || 'assets/image';
const ProcessingRecognitionAssetsFileTypes = process.env.PROCESSING_RECOGNITION_ASSETS_FILE_ENUM_TYPES.toLowerCase().split(',');
const ProcessingRecognitionAssetsFileType = (ProcessingRecognitionAssetsFileTypes.indexOf(process.env.PROCESSING_RECOGNITION_ASSETS_FILE_TYPE.toLowerCase()) > -1) ? process.env.PROCESSING_RECOGNITION_ASSETS_FILE_TYPE.toLowerCase() : 'jpg';
const ImgsPath = Path.resolve(ProcessingRecognitionAssetsPath, ProcessingRecognitionAssetsFileType);
const ImgFiles = Fs.readdirSync(ImgsPath);
const ProcessingRecognitionLabels = ImgFiles
	.map(function (file) {
		return file.split('.')[0].replace(/[^A-Za-z]/g, '');
	}).filter(distinct);

// prepare settings for processing draw-metadata
const LineColorR = parseInt(process.env.PROCESSING_DRAWING_LINE_COLOR_R, 10) || 128;
const LineColorG = parseInt(process.env.PROCESSING_DRAWING_LINE_COLOR_G, 10) || 255;
const LineColorB = parseInt(process.env.PROCESSING_DRAWING_LINE_COLOR_B, 10) || 0;
const LineThickness = parseFloat(process.env.PROCESSING_DRAWING_LINE_THICKNESS) || 1.0;
const TextColorR = parseInt(process.env.PROCESSING_DRAWING_TEXT_COLOR_R, 10) || 128;
const TextColorG = parseInt(process.env.PROCESSING_DRAWING_TEXT_COLOR_G, 10) || 255;
const TextColorB = parseInt(process.env.PROCESSING_DRAWING_TEXT_COLOR_B, 10) || 0;
const TextSize = parseFloat(process.env.PROCESSING_DRAWING_TEXT_SIZE) || 1;
const TextThickness = parseFloat(process.env.PROCESSING_DRAWING_TEXT_THICKNESS) || 1;
const TextAlpha = parseFloat(process.env.PROCESSING_DRAWING_TEXT_BACKGROUND_ALPHA) || 0.0;

// prepare variables for output synchronization
const OutputSyncUse = (process.env.OUTPUT_SYNC_USE.toLowerCase() == 'true') || false;
const OutputSyncPROT = process.env.OUTPUT_SYNC_PROT || 'http';
const OutputSyncHOST = process.env.OUTPUT_SYNC_HOST || 'localhost';
const OutputSyncPORT = parseInt(process.env.OUTPUT_SYNC_PORT, 10) || 3145;
const OutputSyncBASE = process.env.OUTPUT_SYNC_BASE || '';
const OutputSyncURL = OutputSyncPROT + '://' + OutputSyncHOST + ':' + OutputSyncPORT + OutputSyncBASE;
const OutputSyncNAME = process.env.OUTPUT_SYNC_NAME || 'detection';

// prepare settings for output
const OutputSettingsLogLevels = process.env.OUTPUT_SETTINGS_LOG_LEVEL_ENUM.toLowerCase().split(',');
const OutputSettingsLogLevel = (OutputSettingsLogLevels.indexOf(process.env.OUTPUT_SETTINGS_LOG_LEVEL.toLowerCase()) > -1) ? process.env.OUTPUT_SETTINGS_LOG_LEVEL.toLowerCase() : 'warning';
const OutputSettingsImageTypes = process.env.OUTPUT_SETTINGS_IMAGE_ENUM_TYPES.toLowerCase().split(',');
const OutputSettingsImageType = (OutputSettingsImageTypes.indexOf(process.env.OUTPUT_SETTINGS_IMAGE_TYPE.toLowerCase()) > -1) ? process.env.OUTPUT_SETTINGS_IMAGE_TYPE.toLowerCase() : 'png';
const OutputSettingsImageResolutionWidth = parseInt(process.env.OUTPUT_SETTINGS_IMAGE_RESOLUTION_WIDTH, 10) || 1920;
const OutputSettingsImageResolutionHeight = parseInt(process.env.OUTPUT_SETTINGS_IMAGE_RESOLUTION_HEIGHT, 10) || 1080;
const OutputSettingsVideoTypes = process.env.OUTPUT_SETTINGS_VIDEO_ENUM_TYPES.toLowerCase().split(',');
const OutputSettingsVideoType = (OutputSettingsVideoTypes.indexOf(process.env.OUTPUT_SETTINGS_VIDEO_TYPE.toLowerCase()) > -1) ? process.env.OUTPUT_SETTINGS_VIDEO_TYPE.toLowerCase() : 'mp4v';
const OutputSettingsVideoResolutionWidth = parseInt(process.env.OUTPUT_SETTINGS_VIDEO_RESOLUTION_WIDTH, 10) || 1920;
const OutputSettingsVideoResolutionHeight = parseInt(process.env.OUTPUT_SETTINGS_VIDEO_RESOLUTION_HEIGHT, 10) || 1080;

// prepare settings for output image on local filesystem
const OutputLocalImageUse = (process.env.OUTPUT_LOCAL_IMAGE_USE.toLowerCase() == 'true') || false;
const OutputLocalImagePath = process.env.OUTPUT_LOCAL_IMAGE_PATH || 'tmp/images/';
const OutputLocalImageFilename = process.env.OUTPUT_LOCAL_IMAGE_FILENAME || 'output';
const OutputLocalImageFileextension = process.env.OUTPUT_LOCAL_IMAGE_FILEEXTENSION || 'png';

// prepare settings for output video on local filesystem
const OutputLocalVideoUse = (process.env.OUTPUT_LOCAL_VIDEO_USE.toLowerCase() == 'true') || false;
const OutputLocalVideoPath = process.env.OUTPUT_LOCAL_VIDEO_PATH || 'tmp/videos/';
const OutputLocalVideoFilename = process.env.OUTPUT_LOCAL_VIDEO_FILENAME || 'output';
const OutputLocalVideoFileextension = process.env.OUTPUT_LOCAL_VIDEO_FILEEXTENSION || 'mp4';

// prepare settings for output video via serve
const OutputServeUse = (process.env.OUTPUT_SERVE_USE.toLowerCase() == 'true') || false;
const OutputServeFRMT = process.env.OUTPUT_SERVE_FRMT || 'rtp_mpegts';
const OutputServePROT = process.env.OUTPUT_SERVE_PROT || 'rtmp';
const OutputServeHOST = process.env.OUTPUT_SERVE_HOST || 'localhost';
const OutputServePORT = parseInt(process.env.OUTPUT_SERVE_PORT, 10) || 1935;
const OutputServeBASE = process.env.OUTPUT_SERVE_BASE || '/detection/demo';
const OutputServeURL = OutputServePROT + '://' + OutputServeHOST + ':' + OutputServePORT + OutputServeBASE;

/**
 * @constructs environment
 * @description constructs an environment object.
 * @param {Object} _input - the input object.
 * @param {Boolean} _inputSyncUse - the _inputSyncUse property.
 * @param {String} _inputSyncPROT - the _inputSyncPROT property.
 * @param {String} _inputSyncHOST - the _inputSyncHOST property.
 * @param {Integer}	_inputSyncPORT - the _inputSyncPORT property.
 * @param {String} _inputSyncBASE - the _inputSyncBASE property.
 * @param {String} _inputSyncNAME - the _inputSyncNAME property.
 * @param {String[]} _inputSettingsLogLevel_ENUM - the _inputSettingsLogLevel_ENUM property.
 * @param {String} _inputSettingsLogLevel - the _inputSettingsLogLevel property.
 * @param {Integer}	_inputSettingsFps - the _inputSettingsFps property.
 * @param {Boolean}	_inputSettingsScaleUse - the _inputSettingsScaleUse property.
 * @param {Integer}	_inputSettingsScaleWidth - the _inputSettingsScaleWidth property.
 * @param {Integer}	_inputSettingsScaleHeight - the _inputSettingsScaleHeight property.
 * @param {String} _inputSourcePROT - the _inputSourcePROT property.
 * @param {String} _inputSourceHOST - the _inputSourceHOST property.
 * @param {String} _inputSourcePORT - the _inputSourcePORT property.
 * @param {String} _inputSourceBASE - the _inputSourceBASE property.
 * @param {String} _inputSourceURL - the _inputSourceURL property.
 * @param {Integer}	_inputSourcePipePORT - the _inputSourcePipePORT property.
 * @param {Object} _internal - the internal object.
 * @param {Boolean} _internalServeUse - the _internalServeUse property.
 * @param {String} _internalServePROT - the _internalServePROT property.
 * @param {String} _internalServeHOST - the _internalServeHOST property.
 * @param {Integer}	_internalServePORT - the _internalServePORT property.
 * @param {String} _internalServeBASE - the _internalServeBASE property.
 * @param {Object} _processing - the processing object.
 * @param {String[]} _processingSettingsType_ENUM - the _processingSettingsType_ENUM property.
 * @param {String} _processingSettingsType - the _processingSettingsType property.
 * @param {Integer[]}	_processingSettingsFpsType_ENUM - the _processingSettingsFpsType_ENUM property.
 * @param {Integer}	_processingSettingsFps - the _processingSettingsFps property.
 * @param {String[]} _processingDetectionCascadeClassifierType_ENUM - the _processingDetectionCascadeClassifierType_ENUM property.
 * @param {String} _processingDetectionCascadeClassifierType - the _processingDetectionCascadeClassifierType property.
 * @param {Integer}	_processingDetectionConfidenceMin - the _processingDetectionConfidenceMin property.
 * @param {String[]} _processingRecognitionLabels - the _processingRecognitionLabels property.
 * @param {Integer}	_processingRecognitionDistanceMax - the _processingRecognitionDistanceMax property.
 * @param {Integer}	_processingDrawLineColorR - the _processingDrawLineColorR property.
 * @param {Integer}	_processingDrawLineColorG - the _processingDrawLineColorG property.
 * @param {Integer}	_processingDrawLineColorB - the _processingDrawLineColorB property.
 * @param {Integer}	_processingDrawLineThickness - the _processingDrawLineThickness property.
 * @param {Integer}	_processingDrawTextColorR - the _processingDrawTextColorR property.
 * @param {Integer}	_processingDrawTextColorG - the _processingDrawTextColorG property.
 * @param {Integer}	_processingDrawTextColorB - the _processingDrawTextColorB property.
 * @param {Integer}	_processingDrawTextSize - the _processingDrawTextSize property.
 * @param {Integer}	_processingDrawTextThickness - the _processingDrawTextThickness property.
 * @param {Integer}	_processingDrawTextBackgroundAlpha - the _processingDrawTextBackgroundAlpha property.
 * @param {Object} _output - the _output object.
 * @param {Boolean} _outputSyncUse - the _outputSyncUse property.
 * @param {String} _outputSyncPROT - the _outputSyncPROT property.
 * @param {String} _outputSyncHOST - the _outputSyncHOST property.
 * @param {Integer} _outputSyncPORT - the _outputSyncPORT property.
 * @param {String} _outputSyncBASE - the _outputSyncBASE property.
 * @param {String} _outputSyncNAME - the _outputSyncNAME property.
 * @param {String[]} _outputSettingsLogLevel_ENUM - the _outputSettingsLogLevel_ENUM property.
 * @param {String} _outputSettingsLogLevel - the _outputSettingsLogLevel property.
 * @param {String[]} _outputSettingsImageType_ENUM - the _outputSettingsImageType_ENUM property.
 * @param {String} _outputSettingsImageType - the _outputSettingsImageType property.
 * @param {Integer} _outputSettingsImageResolutionWidth - the _outputSettingsImageResolutionWidth property.
 * @param {Integer} _outputSettingsImageResolutionHeight - the _outputSettingsImageResolutionHeight property.
 * @param {String[]} _outputSettingsVideoType_ENUM - the _outputSettingsVideoType_ENUM property.
 * @param {String} _outputSettingsVideoType - the _outputSettingsVideoType property.
 * @param {Integer} _outputSettingsVideoResolutionWidth - the _outputSettingsVideoResolutionWidth property.
 * @param {Integer} _outputSettingsVideoResolutionHeight - the _outputSettingsVideoResolutionHeight property.
 * @param {Boolean} _outputLocalImageUse - the _outputLocalImageUse property.
 * @param {String} _outputLocalImagePath - the _outputLocalImagePath property.
 * @param {String} _outputLocalImageFilename - the _outputLocalImageFilename property.
 * @param {String} _outputLocalImageFileextension - the _outputLocalImageFileextension property.
 * @param {Boolean} _outputLocalVideoUse - the _outputLocalVideoUse property.
 * @param {String} _outputLocalVideoPath - the _outputLocalVideoPath property.
 * @param {String} _outputLocalVideoFilename - the _outputLocalVideoFilename property.
 * @param {String} _outputLocalVideoFileextension - the _outputLocalVideoFileextension property.
 * @param {Boolean} _outputServeUse - the _outputServeUse property.
 * @param {String} _outputServeFRMT - the _outputServeFRMT property.
 * @param {String} _outputServePROT - the _outputServePROT property.
 * @param {String} _outputServeHOST - the _outputServeHOST property.
 * @param {String} _outputServePORT - the _outputServePORT property.
 * @param {String} _outputServeBASE - the _outputServeBASE property.
 * @param {String} _outputServeURL - the _outputServeURL property.
 * @param {Function} config - the config function, returns the environment object.
 */
var environment = {
	_input: {},
	_inputSyncUse: null,
	_inputSyncPROT: null,
	_inputSyncHOST: null,
	_inputSyncPORT: null,
	_inputSyncBASE: null,
	_inputSyncNAME: null,
	_inputSettingsLogLevel_ENUM: null,
	_inputSettingsLogLevel: null,
	_inputSettingsFps: null,
	_inputSettingsScaleUse: null,
	_inputSettingsScaleWidth: null,
	_inputSettingsScaleHeight: null,
	_inputSourcePROT: null,
	_inputSourceHOST: null,
	_inputSourcePORT: null,
	_inputSourceBASE: null,
	_inputSourceURL: null,
	_inputSourcePipePORT: null,
	_internal: {},
	_internalServeUse: null,
	_internalServePROT: null,
	_internalServeHOST: null,
	_internalServePORT: null,
	_internalServeBASE: null,
	_processing: {},
	_processingSettingsType_ENUM: null,
	_processingSettingsType: null,
	_processingSettingsFpsType_ENUM: null,
	_processingSettingsFps: null,
	_processingDetectionCascadeClassifierType_ENUM: null,
	_processingDetectionCascadeClassifierType: null,
	_processingDetectionConfidenceMin: null,
	_processingRecognitionLabels: null,
	_processingRecognitionDistanceMax: null,
	_processingDrawLineColorR: null,
	_processingDrawLineColorG: null,
	_processingDrawLineColorB: null,
	_processingDrawLineThickness: null,
	_processingDrawTextColorR: null,
	_processingDrawTextColorG: null,
	_processingDrawTextColorB: null,
	_processingDrawTextSize: null,
	_processingDrawTextThickness: null,
	_processingDrawTextBackgroundAlpha: null,
	_output: {},
	_outputSyncUse: null,
	_outputSyncPROT: null,
	_outputSyncHOST: null,
	_outputSyncPORT: null,
	_outputSyncBASE: null,
	_outputSyncNAME: null,
	_outputSettingsLogLevel_ENUM: null,
	_outputSettingsLogLevel: null,
	_outputSettingsImageType_ENUM: null,
	_outputSettingsImageType: null,
	_outputSettingsImageResolutionWidth: null,
	_outputSettingsImageResolutionHeight: null,
	_outputSettingsVideoType_ENUM: null,
	_outputSettingsVideoType: null,
	_outputSettingsVideoResolutionWidth: null,
	_outputSettingsVideoResolutionHeight: null,
	_outputLocalImageUse: null,
	_outputLocalImagePath: null,
	_outputLocalImageFilename: null,
	_outputLocalImageFileextension: null,
	_outputLocalVideoUse: null,
	_outputLocalVideoPath: null,
	_outputLocalVideoFilename: null,
	_outputLocalVideoFileextension: null,
	_outputServeUse: null,
	_outputServeFRMT: null,
	_outputServePROT: null,
	_outputServeHOST: null,
	_outputServePORT: null,
	_outputServeBASE: null,
	_outputServeURL: null,
	setInputSyncUse: function (value) {
		environment._inputSyncUse = value;
	},
	inputSyncUse: function () {
		return environment._inputSyncUse;
	},
	setInputSyncPROT: function (value) {
		environment._inputSyncPROT = value;
	},
	inputSyncPROT: function () {
		return environment._inputSyncPROT;
	},
	setInputSyncHOST: function (value) {
		environment._inputSyncHOST = value;
	},
	inputSyncHOST: function () {
		return environment._inputSyncHOST;
	},
	setInputSyncPORT: function (value) {
		environment._inputSyncPORT = value;
	},
	inputSyncPORT: function () {
		return environment._inputSyncPORT;
	},
	setInputSyncBASE: function (value) {
		environment._inputSyncBASE = value;
	},
	inputSyncBASE: function () {
		return environment._inputSyncBASE;
	},
	setInputSyncNAME: function (value) {
		environment._inputSyncNAME = value;
	},
	inputSyncNAME: function () {
		return environment._inputSyncNAME;
	},
	setInputSettingsLogLevel_ENUM: function (value) {
		environment._inputSettingsLogLevel_ENUM = value;
	},
	inputSettingsLogLevel_ENUM: function () {
		return environment._inputSettingsLogLevel_ENUM;
	},
	setInputSettingsLogLevel: function (value) {
		environment._inputSettingsLogLevel = value;
	},
	inputSettingsLogLevel: function () {
		return environment._inputSettingsLogLevel;
	},
	setInputSettingsFps: function (value) {
		environment._inputSettingsFps = value;
	},
	inputSettingsFps: function () {
		return environment._inputSettingsFps;
	},
	setInputSettingsScaleUse: function (value) {
		environment._inputSettingsScaleUse = value;
	},
	inputSettingsScaleUse: function () {
		return environment._inputSettingsScaleUse;
	},
	setInputSettingsScaleWidth: function (value) {
		environment._inputSettingsScaleWidth = value;
	},
	inputSettingsScaleWidth: function () {
		return environment._inputSettingsScaleWidth;
	},
	setInputSettingsScaleHeight: function (value) {
		environment._inputSettingsScaleHeight = value;
	},
	inputSettingsScaleHeight: function () {
		return environment._inputSettingsScaleHeight;
	},
	setInputSourcePROT: function (value) {
		environment._inputSourcePROT = value;
	},
	inputSourcePROT: function () {
		return environment._inputSourcePROT;
	},
	setInputSourceHOST: function (value) {
		environment._inputSourceHOST = value;
	},
	inputSourceHOST: function () {
		return environment._inputSourceHOST;
	},
	setInputSourcePORT: function (value) {
		environment._inputSourcePORT = value;
	},
	inputSourcePORT: function () {
		return environment._inputSourcePORT;
	},
	setInputSourceBASE: function (value) {
		environment._inputSourceBASE = value;
	},
	inputSourceBASE: function () {
		return environment._inputSourceBASE;
	},
	setInputSourceURL: function (value) {
		environment._inputSourceURL = value;
	},
	inputSourceURL: function () {
		return environment._inputSourceURL;
	},
	setInputSourcePipePORT: function (value) {
		environment._inputSourcePipePORT = value;
	},
	inputSourcePipePORT: function () {
		return environment._inputSourcePipePORT;
	},
	inputSynchronization: function () {
		var obj = {
			active: environment.inputSyncUse()
		};
		if (environment.inputSyncUse()) {
			obj.prot = environment.inputSyncPROT();
			obj.host = environment.inputSyncHOST();
			obj.port = environment.inputSyncPORT();
			obj.base = environment.inputSyncBASE();
			obj.name = environment.inputSyncNAME();
		}
		return obj;
	},
	inputSettings: function () {
		var obj = {
			loglevel_ENUM: environment.inputSettingsLogLevel_ENUM(),
			loglevel: environment.inputSettingsLogLevel(),
			fps: environment.inputSettingsFps(),
			scale: {
				active: environment.inputSettingsScaleUse()
			},
		};
		if (environment.inputSettingsScaleUse()) {
			obj.scale.height = environment.inputSettingsScaleHeight();
			obj.scale.width = environment.inputSettingsScaleWidth();
		}
		return obj;
	},
	inputSource: function () {
		// if (!environment.inputSourceURL() || environment.inputSourceURL().lenght < 2) {
		// 	environment.setInputSourceURL(environment.inputSourcePROT() + '://' + environment.inputSourceHOST() + ':' + environment.inputSourcePORT() + environment.inputSourceBASE());
		// }
		var obj = {
			prot: environment.inputSourcePROT(),
			host: environment.inputSourceHOST(),
			port: environment.inputSourcePORT(),
			base: environment.inputSourceBASE(),
			url: environment.inputSourceURL(),
			pipe: environment.inputSourcePipePORT()
		}
		return obj;
	},
	input: function () {
		return {
			synchronization: environment.inputSynchronization(),
			settings: environment.inputSettings(),
			source: environment.inputSource()
		};
	},
	setInternalServeUse: function (value) {
		environment._internalServeUse = value;
	},
	internalServeUse: function () {
		return environment._internalServeUse;
	},
	setInternalServePROT: function (value) {
		environment._internalServePROT = value;
	},
	internalServePROT: function () {
		return environment._internalServePROT;
	},
	setInternalServeHOST: function (value) {
		environment._internalServeHOST = value;
	},
	internalServeHOST: function () {
		return environment._internalServeHOST;
	},
	setInternalServePORT: function (value) {
		environment._internalServePORT = value;
	},
	internalServePORT: function () {
		return environment._internalServePORT;
	},
	setInternalServeBASE: function (value) {
		environment._internalServeBASE = value;
	},
	internalServeBASE: function () {
		return environment._internalServeBASE;
	},
	internalServe: function () {
		var obj = {
			active: environment.internalServeUse()
		};
		if (environment.internalServeUse()) {
			obj.prot = environment.internalServePROT();
			obj.host = environment.internalServeHOST();
			obj.port = environment.internalServePORT();
			obj.base = environment.internalServeBASE();
		}
		return obj;
	},
	internal: function () {
		return {
			serve: environment.internalServe()
		};
	},
	setProcessingSettingsType_ENUM: function (value) {
		environment._processingSettingsType_ENUM = value;
	},
	processingSettingsType_ENUM: function () {
		return environment._processingSettingsType_ENUM;
	},
	setProcessingSettingsType: function (value) {
		environment._processingSettingsType = value;
	},
	processingSettingsType: function () {
		return environment._processingSettingsType;
	},
	setProcessingSettingsFpsType_ENUM: function (value) {
		environment._processingSettingsFpsType_ENUM = value;
	},
	processingSettingsFpsType_ENUM: function () {
		return environment._processingSettingsFpsType_ENUM;
	},
	setProcessingSettingsFps: function (value) {
		environment._processingSettingsFps = value;
	},
	processingSettingsFps: function () {
		return environment._processingSettingsFps;
	},
	setProcessingDetectionCascadeClassifierType_ENUM: function (value) {
		environment._processingDetectionCascadeClassifierType_ENUM = value;
	},
	processingDetectionCascadeClassifierType_ENUM: function () {
		return environment._processingDetectionCascadeClassifierType_ENUM;
	},
	setProcessingDetectionCascadeClassifierType: function (value) {
		environment._processingDetectionCascadeClassifierType = value;
	},
	processingDetectionCascadeClassifierType: function () {
		return environment._processingDetectionCascadeClassifierType;
	},
	setProcessingDetectionConfidenceMin: function (value) {
		environment._processingDetectionConfidenceMin = value;
	},
	processingDetectionConfidenceMin: function () {
		return environment._processingDetectionConfidenceMin;
	},
	setProcessingRecognitionLabels: function (value) {
		environment._processingRecognitionLabels = value;
	},
	processingRecognitionLabels: function () {
		return environment._processingRecognitionLabels;
	},
	setProcessingRecognitionDistanceMax: function (value) {
		environment._processingRecognitionDistanceMax = value;
	},
	processingRecognitionDistanceMax: function () {
		return environment._processingRecognitionDistanceMax;
	},
	setProcessingDrawLineColorR: function (value) {
		environment._processingDrawLineColorR = value;
	},
	processingDrawLineColorR: function () {
		return environment._processingDrawLineColorR;
	},
	setProcessingDrawLineColorG: function (value) {
		environment._processingDrawLineColorG = value;
	},
	processingDrawLineColorG: function () {
		return environment._processingDrawLineColorG;
	},
	setProcessingDrawLineColorB: function (value) {
		environment._processingDrawLineColorB = value;
	},
	processingDrawLineColorB: function () {
		return environment._processingDrawLineColorB;
	},
	setProcessingDrawLineThickness: function (value) {
		environment._processingDrawLineThickness = value;
	},
	processingDrawLineThickness: function () {
		return environment._processingDrawLineThickness;
	},
	setProcessingDrawTextColorR: function (value) {
		environment._processingDrawTextColorR = value;
	},
	processingDrawTextColorR: function () {
		return environment._processingDrawTextColorR;
	},
	setProcessingDrawTextColorG: function (value) {
		environment._processingDrawTextColorG = value;
	},
	processingDrawTextColorG: function () {
		return environment._processingDrawTextColorG;
	},
	setProcessingDrawTextColorB: function (value) {
		environment._processingDrawTextColorB = value;
	},
	processingDrawTextColorB: function () {
		return environment._processingDrawTextColorB;
	},
	setProcessingDrawTextSize: function (value) {
		environment._processingDrawTextSize = value;
	},
	processingDrawTextSize: function () {
		return environment._processingDrawTextSize;
	},
	setProcessingDrawTextThickness: function (value) {
		environment._processingDrawTextThickness = value;
	},
	processingDrawTextThickness: function () {
		return environment._processingDrawTextThickness;
	},
	setProcessingDrawTextBackgroundAlpha: function (value) {
		environment._processingDrawTextBackgroundAlpha = value;
	},
	processingDrawTextBackgroundAlpha: function () {
		return environment._processingDrawTextBackgroundAlpha;
	},
	processingSettings: function () {
		return {
			type_ENUM: environment.processingSettingsType_ENUM(),
			type: environment.processingSettingsType(),
			fps_ENUM: environment.processingSettingsFpsType_ENUM(),
			fps: environment.processingSettingsFps(),
		};
	},
	processingDetection: function () {
		return {
			cascade_classifier_ENUM: environment.processingDetectionCascadeClassifierType_ENUM(),
			cascade_classifier: environment.processingDetectionCascadeClassifierType(),
			confidence_min: environment.processingDetectionConfidenceMin()
		};
	},
	processingRecognition: function () {
		return {
			labels: environment.processingRecognitionLabels(),
			distance_max: environment.processingRecognitionDistanceMax()
		};
	},
	processingDraw: function () {
		return {
			line: {
				r: environment.processingDrawLineColorR(),
				g: environment.processingDrawLineColorG(),
				b: environment.processingDrawLineColorB(),
				thickness: environment.processingDrawLineThickness(),
			},
			text: {
				r: environment.processingDrawTextColorR(),
				g: environment.processingDrawTextColorG(),
				b: environment.processingDrawTextColorB(),
				size: environment.processingDrawTextSize(),
				thickness: environment.processingDrawTextThickness(),
				alpha: environment.processingDrawTextBackgroundAlpha(),
			}
		};
	},
	processing: function () {
		return {
			settings: environment.processingSettings(),
			detection: environment.processingDetection(),
			recognition: environment.processingRecognition(),
			draw: environment.processingDraw()
		};
	},
	setOutputSyncUse: function (value) {
		environment._outputSyncUse = value;
	},
	outputSyncUse: function () {
		return environment._outputSyncUse;
	},
	setOutputSyncPROT: function (value) {
		environment._outputSyncPROT = value;
	},
	outputSyncPROT: function () {
		return environment._outputSyncPROT;
	},
	setOutputSyncHOST: function (value) {
		environment._outputSyncHOST = value;
	},
	outputSyncHOST: function () {
		return environment._outputSyncHOST;
	},
	setOutputSyncPORT: function (value) {
		environment._outputSyncPORT = value;
	},
	outputSyncPORT: function () {
		return environment._outputSyncPORT;
	},
	setOutputSyncBASE: function (value) {
		environment._outputSyncBASE = value;
	},
	outputSyncBASE: function () {
		return environment._outputSyncBASE;
	},
	setOutputSyncNAME: function (value) {
		environment._outputSyncNAME = value;
	},
	outputSyncNAME: function () {
		return environment._outputSyncNAME;
	},
	setOutputSettingsLogLevel_ENUM: function (value) {
		environment._outputSettingsLogLevel_ENUM = value;
	},
	outputSettingsLogLevel_ENUM: function () {
		return environment._outputSettingsLogLevel_ENUM;
	},
	setOutputSettingsLogLevel: function (value) {
		environment._outputSettingsLogLevel = value;
	},
	outputSettingsLogLevel: function () {
		return environment._outputSettingsLogLevel;
	},
	setOutputSettingsImageType_ENUM: function (value) {
		environment._outputSettingsImageType_ENUM = value;
	},
	outputSettingsImageType_ENUM: function () {
		return environment._outputSettingsImageType_ENUM;
	},
	setOutputSettingsImageType: function (value) {
		environment._outputSettingsImageType = value;
	},
	outputSettingsImageType: function () {
		return environment._outputSettingsImageType;
	},
	setOutputSettingsImageResolutionWidth: function (value) {
		environment._outputSettingsImageResolutionWidth = value;
	},
	outputSettingsImageResolutionWidth: function () {
		return environment._outputSettingsImageResolutionWidth;
	},
	setOutputSettingsImageResolutionHeight: function (value) {
		environment._outputSettingsImageResolutionHeight = value;
	},
	outputSettingsImageResolutionHeight: function () {
		return environment._outputSettingsImageResolutionHeight;
	},
	setOutputSettingsVideoType_ENUM: function (value) {
		environment._outputSettingsVideoType_ENUM = value;
	},
	outputSettingsVideoType_ENUM: function () {
		return environment._outputSettingsVideoType_ENUM;
	},
	setOutputSettingsVideoType: function (value) {
		environment._outputSettingsVideoType = value;
	},
	outputSettingsVideoType: function () {
		return environment._outputSettingsVideoType;
	},
	setOutputSettingsVideoResolutionWidth: function (value) {
		environment._outputSettingsVideoResolutionWidth = value;
	},
	outputSettingsVideoResolutionWidth: function () {
		return environment._outputSettingsVideoResolutionWidth;
	},
	setOutputSettingsVideoResolutionHeight: function (value) {
		environment._outputSettingsVideoResolutionHeight = value;
	},
	outputSettingsVideoResolutionHeight: function () {
		return environment._outputSettingsVideoResolutionHeight;
	},
	setOutputLocalImageUse: function (value) {
		environment._outputLocalImageUse = value;
	},
	outputLocalImageUse: function () {
		return environment._outputLocalImageUse;
	},
	setOutputLocalImagePath: function (value) {
		environment._outputLocalImagePath = value;
	},
	outputLocalImagePath: function () {
		return environment._outputLocalImagePath;
	},
	setOutputLocalImageFilename: function (value) {
		environment._outputLocalImageFilename = value;
	},
	outputLocalImageFilename: function () {
		return environment._outputLocalImageFilename;
	},
	setOutputLocalImageFileextension: function (value) {
		environment._outputLocalImageFileextension = value;
	},
	outputLocalImageFileextension: function () {
		return environment._outputLocalImageFileextension;
	},
	setOutputLocalVideoUse: function (value) {
		environment._outputLocalVideoUse = value;
	},
	outputLocalVideoUse: function () {
		return environment._outputLocalVideoUse;
	},
	setOutputLocalVideoPath: function (value) {
		environment._outputLocalVideoPath = value;
	},
	outputLocalVideoPath: function () {
		return environment._outputLocalVideoPath;
	},
	setOutputLocalVideoFilename: function (value) {
		environment._outputLocalVideoFilename = value;
	},
	outputLocalVideoFilename: function () {
		return environment._outputLocalVideoFilename;
	},
	setOutputLocalVideoFileextension: function (value) {
		environment._outputLocalVideoFileextension = value;
	},
	outputLocalVideoFileextension: function () {
		return environment._outputLocalVideoFileextension;
	},
	setOutputServeUse: function (value) {
		environment._outputServeUse = value;
	},
	outputServeUse: function () {
		return environment._outputServeUse;
	},
	setOutputServeFRMT: function (value) {
		environment._outputServeFRMT = value;
	},
	outputServeFRMT: function () {
		return environment._outputServeFRMT;
	},
	setOutputServePROT: function (value) {
		environment._outputServePROT = value;
	},
	outputServePROT: function () {
		return environment._outputServePROT;
	},
	setOutputServeHOST: function (value) {
		environment._outputServeHOST = value;
	},
	outputServeHOST: function () {
		return environment._outputServeHOST;
	},
	setOutputServePORT: function (value) {
		environment._outputServePORT = value;
	},
	outputServePORT: function () {
		return environment._outputServePORT;
	},
	setOutputServeBASE: function (value) {
		environment._outputServeBASE = value;
	},
	outputServeBASE: function () {
		return environment._outputServeBASE;
	},
	setOutputServeURL: function (value) {
		environment._outputServeURL = value;
	},
	outputServeURL: function () {
		return environment._outputServeURL;
	},
	outputSynchronization: function () {
		var obj = {
			active: environment.outputSyncUse()
		};
		if (environment.outputSyncUse()) {
			obj.prot = environment.outputSyncPROT();
			obj.host = environment.outputSyncHOST();
			obj.port = environment.outputSyncPORT();
			obj.base = environment.outputSyncBASE();
			obj.name = environment.outputSyncNAME();
		}
		return obj;
	},
	outputSettings: function () {
		return {
			loglevel_ENUM: environment.outputSettingsLogLevel_ENUM(),
			loglevel: environment.outputSettingsLogLevel(),
			image: {
				type_ENUM: environment.outputSettingsImageType_ENUM(),
				type: environment.outputSettingsImageType(),
				width: environment.outputSettingsImageResolutionWidth(),
				height: environment.outputSettingsImageResolutionHeight()
			},
			video: {
				type_ENUM: environment.outputSettingsVideoType_ENUM(),
				type: environment.outputSettingsVideoType(),
				width: environment.outputSettingsVideoResolutionWidth(),
				height: environment.outputSettingsVideoResolutionHeight()
			}
		};
	},
	outputLocalImage: function () {
		var obj = {
			active: environment.outputLocalImageUse()
		};
		if (environment.outputLocalImageUse()) {
			obj.path = environment.outputLocalImagePath();
			obj.filename = environment.outputLocalImageFilename();
			obj.fileextension = environment.outputLocalImageFileextension();
		}
		return obj;
	},
	outputLocalVideo: function () {
		var obj = {
			active: environment.outputLocalVideoUse()
		};
		if (environment.outputLocalVideoUse()) {
			obj.path = environment.outputLocalVideoPath();
			obj.filename = environment.outputLocalVideoFilename();
			obj.fileextension = environment.outputLocalVideoFileextension();
		}
		return obj;
	},
	outputLocal: function () {
		return {
			image: environment.outputLocalImage(),
			video: environment.outputLocalVideo()
		};
	},
	outputServe: function () {
		var obj = {
			active: environment.outputServeUse()
		};
		if (environment.outputServeUse()) {
			// if (!environment.outputServeURL() || environment.outputServeURL().lenght < 2) {
			// 	environment.setOutputServeURL(environment.outputServePROT() + '://' + environment.outputServeHOST() + ':' + environment.outputServePORT() + environment.outputServeBASE());
			// }
			obj.frmt = environment.outputServeFRMT();
			obj.prot = environment.outputServePROT();
			obj.host = environment.outputServeHOST();
			obj.port = environment.outputServePORT();
			obj.base = environment.outputServeBASE();
			obj.url = environment.outputServeURL();
		}
		return obj;
	},
	output: function () {
		return {
			synchronization: environment.outputSynchronization(),
			settings: environment.outputSettings(),
			local: environment.outputLocal(),
			serve: environment.outputServe()
		};
	},
	config: function () {
		return {
			input: environment.input(),
			interal: environment.internal(),
			processing: environment.processing(),
			output: environment.output()
		};
	}
}

environment.setInputSyncUse(InputSyncUse);
environment.setInputSyncPROT(InputSyncPROT);
environment.setInputSyncHOST(InputSyncHOST);
environment.setInputSyncPORT(InputSyncPORT);
environment.setInputSyncBASE(InputSyncBASE);
environment.setInputSyncNAME(InputSyncNAME);
environment.setInputSettingsLogLevel_ENUM(InputSettingsLogLevels);
environment.setInputSettingsLogLevel(InputSettingsLogLevel);
environment.setInputSettingsFps(InputSettingsFPS);
environment.setInputSettingsScaleUse(InputSettingsScaleUse);
environment.setInputSettingsScaleWidth(InputSettingsScaleWidth);
environment.setInputSettingsScaleHeight(InputSettingsScaleHeight);
environment.setInputSourcePROT(InputSourcePROT);
environment.setInputSourceHOST(InputSourceHOST);
environment.setInputSourcePORT(InputSourcePORT);
environment.setInputSourceBASE(InputSourceBASE);
environment.setInputSourceURL(InputSourceURL);
environment.setInputSourcePipePORT(InputSourcePipePORT);

environment.setInternalServeUse(InternalServeUse);
environment.setInternalServePROT(InternalServePROT);
environment.setInternalServeHOST(InternalServeHOST);
environment.setInternalServePORT(InternalServePORT);
environment.setInternalServeBASE(InternalServeBASE);

environment.setProcessingSettingsType_ENUM(ProcessingSettingsTypes);
environment.setProcessingSettingsType(ProcessingSettingsType);
environment.setProcessingSettingsFpsType_ENUM(ProcessingSettingsFpsTypes);
environment.setProcessingSettingsFps(ProcessingSettingsFps);
environment.setProcessingDetectionCascadeClassifierType_ENUM(ProcessingDetectionCascadeClassifierTypes);
environment.setProcessingDetectionCascadeClassifierType(ProcessingDetectionCascadeClassifierType);
environment.setProcessingDetectionConfidenceMin(ProcessingDetectionConfidenceMin);
environment.setProcessingRecognitionLabels(ProcessingRecognitionLabels);
environment.setProcessingRecognitionDistanceMax(ProcessingRecognitionDistanceMax);
environment.setProcessingDrawLineColorR(LineColorR);
environment.setProcessingDrawLineColorG(LineColorG);
environment.setProcessingDrawLineColorB(LineColorB);
environment.setProcessingDrawLineThickness(LineThickness);
environment.setProcessingDrawTextColorR(TextColorR);
environment.setProcessingDrawTextColorG(TextColorG);
environment.setProcessingDrawTextColorB(TextColorB);
environment.setProcessingDrawTextSize(TextSize);
environment.setProcessingDrawTextThickness(TextThickness);
environment.setProcessingDrawTextBackgroundAlpha(TextAlpha);

environment.setOutputSyncUse(OutputSyncUse);
environment.setOutputSyncPROT(OutputSyncPROT);
environment.setOutputSyncHOST(OutputSyncHOST);
environment.setOutputSyncPORT(OutputSyncPORT);
environment.setOutputSyncBASE(OutputSyncBASE);
environment.setOutputSyncNAME(OutputSyncNAME);
environment.setOutputSettingsLogLevel_ENUM(OutputSettingsLogLevels);
environment.setOutputSettingsLogLevel(OutputSettingsLogLevel);
environment.setOutputSettingsImageType_ENUM(OutputSettingsImageTypes);
environment.setOutputSettingsImageType(OutputSettingsImageType);
environment.setOutputSettingsImageResolutionWidth(OutputSettingsImageResolutionWidth);
environment.setOutputSettingsImageResolutionHeight(OutputSettingsImageResolutionHeight);
environment.setOutputSettingsVideoType_ENUM(OutputSettingsVideoTypes);
environment.setOutputSettingsVideoType(OutputSettingsVideoType);
environment.setOutputSettingsVideoResolutionWidth(OutputSettingsVideoResolutionWidth);
environment.setOutputSettingsVideoResolutionHeight(OutputSettingsVideoResolutionHeight);
environment.setOutputLocalImageUse(OutputLocalImageUse);
environment.setOutputLocalImagePath(OutputLocalImagePath);
environment.setOutputLocalImageFilename(OutputLocalImageFilename);
environment.setOutputLocalImageFileextension(OutputLocalImageFileextension);
environment.setOutputLocalVideoUse(OutputLocalVideoUse);
environment.setOutputLocalVideoPath(OutputLocalVideoPath);
environment.setOutputLocalVideoFilename(OutputLocalVideoFilename);
environment.setOutputLocalVideoFileextension(OutputLocalVideoFileextension);
environment.setOutputServeUse(OutputServeUse);
environment.setOutputServeFRMT(OutputServeFRMT);
environment.setOutputServePROT(OutputServePROT);
environment.setOutputServeHOST(OutputServeHOST);
environment.setOutputServePORT(OutputServePORT);
environment.setOutputServeBASE(OutputServeBASE);
environment.setOutputServeURL(OutputServeURL);

/**
 * @constructs vDetection
 * @description constructs an vDetection object.
 * @param {Object} _timer - the _timer object.
 * @param {Function} start - the start function.
 * @param {Function} stop - the stop function.
 * @fires Input.onStart
 * @fires Input.onStop
 * @fires Output.start
 * @fires Output.stop
 * @fires environment.config
 */
var vDetection = {
	_timer: null,
	start: function (environment) {
		var deferred = Q.defer();
		const timestamp = Date.now();
		Input.onStart(environment)
			.then(function (data) {
				const now = Date.now();
				Output.start(environment, data);
				deferred.resolve({
					timestamp: timestamp,
					elapsed: now - timestamp,
					config: environment.config()
				});
			}).catch(function (error) {
				deferred.reject({
					timestamp: timestamp,
					message: err,
					config: environment.config()
				});
			});
		return deferred.promise;
	},
	stop: function (environment) {
		var deferred = Q.defer();
		const timestamp = Date.now();
		Input.onStop(environment)
			.then(function (data) {
				const now = Date.now();
				Output.stop();
				deferred.resolve({
					timestamp: timestamp,
					elapsed: now - timestamp,
					config: environment.config()
				});
			}).catch(function (error) {
				deferred.reject({
					timestamp: timestamp,
					message: err,
					config: environment.config()
				});
			});
		return deferred.promise;
	}
};

// export module 'vDetection'
module.exports = {
	environment,
	vDetection
};