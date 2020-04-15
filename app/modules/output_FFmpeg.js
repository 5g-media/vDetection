/**
 * @file Provides the module 'output_FFmpeg'.
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
 * @module output_FFmpeg
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires modules:synchronization
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const Synchronization = require('./synchronization');

// prepare variables for spawn process
var cmd = {
	data: 1,
	error: 2,
	debug: 3,
	status: 4,
	config: 5
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

// define 'on'-event functions

/**
 * @function onError
 * @description send a synchronization message, triggered by an error event.
 * @param {String} msg - the message
 * @param {Object} error - the system error
 * @fires Synchronization.sync
 */
var onError = function (msg, error) {
	console.log(msg, error);
	Synchronization.sync(getSyncPayload(cmd.error, msg));
};

/**
 * @function onExit
 * @description send a synchronization message, triggered by an exit event.
 * @param {String} msg - the message
 * @fires Synchronization.sync
 */
var onExit = function (msg) {
	Synchronization.sync(getSyncPayload(cmd.debug, msg));
};

/**
 * @function onDebug
 * @description send a synchronization message, triggered by an debug event.
 * @param {String} msg - the message
 * @fires Synchronization.sync
 */
var onDebug = function (msg) {
	Synchronization.sync(getSyncPayload(cmd.debug, msg));
};

/**
 * @constructs FFmpeg
 * @description constructs an ffmpeg object.
 * @param {String} _cmd - the command to spawn.
 * @param {Object} _spawn - the spawn object.
 * @param {Object} _process - the spawned process object.
 * @param {Object} _videoStream - the videoStream object.
 * @param {Integer} _timer - the timer.
 * @param {Function} args - the args function, returns an array of arguments.
 * @param {Function} options - the options function, returns an array of options.
 * @param {Function} start - the start function, starts the input.
 * @param {Function} stop - the stop function, stops the input.
 * @fires child_process:spawn
 * @fires child_process:kill
 * @fires stream:passthrough:pipe
 * @fires stream:passthrough:unpipe
 */
var FFmpeg = {
	_cmd: 'ffmpeg',
	_spawn: require('child_process').spawn,
	_process: null,
	_videoStream: null,
	_timer: null,
	args: function (environment) {
		var input = [
			'-hide_banner',
			'-y',
			'-loglevel', environment.outputSettingsLogLevel(),
			/**
			 * #### #### #### 0: external video from ffmpeg1
			 */
			'-re',
			'-analyzeduration', 0,
			'-fflags', 'nobuffer',
			'-i', 'pipe:3',
			/**
			 * #### #### #### 1: external audio from ffmpeg1
			 */
			'-analyzeduration', 0,
			'-fflags', 'nobuffer',
			'-i', environment.inputSourceURL()
		];
		var overlay = [
			/**
			 * #### #### #### out: overlay both input 0, 1 streams
			 */
			'-filter_complex',
			'[0:v]chromakey=black[ckout];[1:v][ckout]overlay=alpha=straight'
		];
		var stack = [
			/**
			 * #### #### #### out: stack both input 0, 1 streams
			 */
			'-filter_complex',
			'[0:v][1:v]vstack=2'
		];
		var output = [
			/**
			 * #### #### #### out: output
			 */
			'-map', '0:v',
			'-c:v', 'libx264',
			'-map', '1:a',
			'-c:a', 'copy',
			'-g', '25',
			'-preset', 'ultrafast',
			'-tune', 'zerolatency',
			'-maxrate', '1000k',
			'-bufsize', '500k',
			'-f', environment.outputServeFRMT(),
			environment.outputServeURL()
		];
		return (environment.outputSettingsImageType() === 'png') ? input.concat(overlay).concat(output) : input.concat(stack).concat(output);
	},
	options: function () {
		return {
			stdio: [
				'ignore',
				'ignore',
				'ignore',
				'pipe'
			]
		}
	},
	start: function (environment, videoStream) {
		var deferred = Q.defer();
		try {
			FFmpeg._videoStream = videoStream;
			FFmpeg._process = FFmpeg._spawn(FFmpeg._cmd, FFmpeg.args(environment), FFmpeg.options());
			FFmpeg._videoStream.pipe(FFmpeg._process.stdio[3])
				.on('close', function (code, signal) {})
				.on('end', function (code, signal) {})
				.on('error', function (error) {
					console.log('error');
				});
			FFmpeg._process
				.on('error', function (error) {
					onError('output: failed to spawn cmd FFmpeg', error);
					deferred.reject(error);
				})
				.on('exit', function (code, signal) {
					onExit('output: exit');
					deferred.reject(code);
				})
				.on('disconnect', function (code, signal) {
					onDebug('output: disconnect');
					deferred.reject(code);
				})
				.on('close', function (code, signal) {
					onDebug('output: close');
					deferred.reject(code);
				});
			FFmpeg._process.stdio[3]
				.on('close', function (code, signal) {
					onDebug('output stdio[3]: close');
					deferred.reject(code);
				})
				.on('end', function (code, signal) {
					onDebug('output stdio[3]: end');
					deferred.reject(code);
				})
				.on('error', function (error) {
					onError('output stdio[3]: error', error);
					deferred.reject(error);
				});
		} catch (error) {
			deferred.reject(error)
		}
		return deferred.promise;
	},
	stop: function () {
		var deferred = Q.defer();
		if (FFmpeg._process) {
			FFmpeg._process.kill();
			FFmpeg._process = null;
			FFmpeg._videoStream.unpipe();
			FFmpeg._videoStream = null;
			deferred.resolve();
		} else {
			deferred.reject();
		}
		return deferred.promise;
	}
};

// export module 'output_FFmpeg'
module.exports = FFmpeg;