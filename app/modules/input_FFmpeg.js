/**
 * @file Provides the module 'input_FFmpeg'.
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
 * @module input_FFmpeg
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:stream
 * @requires modules:internal_switch-pipe
 * @requires modules:synchronization
 * @requires modules:processing
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");
const {
	PassThrough
} = require('stream');
const SwitchPipe = require('./internal_switch-pipe');
const Synchronization = require('./synchronization');
const Processing = require('./processing');

// prepare variables for spawn process
var currentState = null;
var forceStop = false;

var state = {
	stop: 1,
	start: 2,
	started: 3,
	stopped: 4,
	timeout: 5,
	restart: 6
};

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

/**
 * @function statusMessage
 * @description Returns an object for status.
 * @param {String} state - the state message
 * @returns {Object}
 */
var statusMessage = function (state) {
	state = state || currentState;
	return getSyncPayload(cmd.status, state);
};

/**
 * @function killProcesses
 * @description Returns an promise object.
 * @param {Object} environment - the environment object.
 * @fires Processing.stop
 * @fires FFmpeg.stop
 * @returns {Object}
 */
var killProcesses = function (environment) {
	var deferred = Q.defer();
	FFmpeg.stop(environment)
		.then(function (data) {
			deferred.resolve(data);
		}).catch(function (error) {
			deferred.reject(error);
		});
	return deferred.promise;
};

// define 'on'-event functions

/**
 * @function onError
 * @description send a synchronization message, triggered by an error event.
 * @param {String} msg - the message
 * @param {Object} err - the system error
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
 * @fires onStart
 * @fires onStopped
 * @fires Synchronization.sync
 */
var onExit = function (msg) {
	Synchronization.sync(getSyncPayload(cmd.debug, msg));
	if (currentState === state.stop) {
		// onStop was manually triggered, thus nop
	} else if (currentState === state.timeout) {
		// nop
	} else if (currentState === state.restart) {
		onStart();
	} else {
		onStopped();
	}
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
 * @function onStart
 * @description send a synchronization message, triggered by an start event. returns a promise object.
 * @param {Object} environment - the environment object.
 * @fires Synchronization.sync
 * @fires Processing.setClient
 * @fires FFmpeg.start
 * @returns {Object}
 */
var onStart = function (environment) {
	var deferred = Q.defer();
	currentState = state.start;
	forceStop = false;
	Synchronization.sync(statusMessage());
	Processing.setClient();
	FFmpeg.start(environment)
		.then(function (data) {
			// const timestamp = Date.now();
			deferred.resolve(data);
		}).catch(function (error) {
			deferred.reject(error);
		});
	return deferred.promise;
};

/**
 * @function onStop
 * @description send a synchronization message, triggered by an stop event. returns a promise object.
 * @param {Object} environment - the environment object.
 * @fires Synchronization.sync
 * @fires killProcesses
 * @returns {Object}
 */
var onStop = function (environment) {
	var deferred = Q.defer();
	currentState = state.stop;
	forceStop = true;
	Synchronization.sync(statusMessage());
	killProcesses(environment)
		.then(function (data) {
			// const timestamp = Date.now();
			deferred.resolve(data);
		}).catch(function (error) {
			deferred.reject(error);
		});
	return deferred.promise;
};

/**
 * @function onStarted
 * @description send a synchronization message, triggered by an started event.
 * @fires Synchronization.sync
 */
var onStarted = function () {
	currentState = state.started;
	Synchronization.sync(statusMessage());
};

/**
 * @function onStopped
 * @description send a synchronization message, triggered by an stopped event.
 * @fires Synchronization.sync
 */
var onStopped = function () {
	currentState = state.stopped;
	Synchronization.sync(statusMessage());
};

/**
 * @function onTimeout
 * @description send a synchronization message, triggered by an timeout event.
 * @fires Synchronization.sync
 * @fires killProcesses
 */
var onTimeout = function () {
	currentState = state.timeout;
	Synchronization.sync(statusMessage());
	killProcesses();
};

/**
 * @constructs FFmpeg
 * @description constructs an FFmpeg object.
 * @param {String} _cmd - the command to spawn.
 * @param {Object} _spawn - the spawn object.
 * @param {Object} _process - the spawned process object.
 * @param {Integer} _timer - the timer.
 * @param {Function} args - the args function, returns an array of arguments.
 * @param {Function} options - the options function, returns an array of options.
 * @param {Function} onStart - the onStart function.
 * @param {Function} onStop - the onStop function.
 * @param {Function} start - the start function, starts the input.
 * @param {Function} stop - the stop function, stops the input.
 * @fires child_process:spawn
 * @fires child_process:kill
 * @fires stream:passthrough:pipe
 * @fires stream:passthrough:unpipe
 * @fires SwitchPipe.start
 * @fires onStart
 * @fires onStop
 */
var FFmpeg = {
	_cmd: 'ffmpeg',
	_spawn: require('child_process').spawn,
	_process: null,
	_videoStream: null,
	_audioStream: null,
	_timer: null,
	args: function (environment) {
		return [
			'-hide_banner',
			'-y',
			'-loglevel', environment.inputSettingsLogLevel(),
			/**
			 * #### #### #### 0: external stream from source
			 */
			'-analyzeduration', 0,
			'-fflags', 'nobuffer',
			'-i', environment.inputSourceURL(),
			/**
			 * #### #### #### 1: internal stream from switch
			 */
			'-re',
			'-f', 'image2pipe',
			'-framerate', environment.processingSettingsFps(),
			'-thread_queue_size', '4096',
			'-analyzeduration', 0,
			'-fflags', 'nobuffer',
			'-i', 'pipe:' + environment.inputSourcePipePORT(),
			/**
			 * #### #### #### out 0: serve external stream from source to opencv
			 */
			'-map', '0:v',
			'-an',
			'-r', environment.processingSettingsFps(),
			'-avioflags', 'direct',
			'-f', 'image2pipe',
			'pipe:1',
			/**
			 * #### #### #### out 1: output
			 */
			'-map', '1:v',
			'-c:v', 'libx264',
			'-an',
			'-vf', 'fps=fps=25,format=yuv420p',
			'-g', '25',
			'-preset', 'ultrafast',
			'-tune', 'zerolatency',
			'-avioflags', 'direct',
			'-maxrate', '1000k',
			'-bufsize', '500k',
			'-f', 'mpegts',
			'pipe:3'
		];
	},
	options: function () {
		return {
			stdio: [
				'pipe',
				'pipe',
				'pipe',
				'pipe'
			]
		}
	},
	onStart: function (environment) {
		var deferred = Q.defer();
		onStart(environment)
			.then(function (data) {
				deferred.resolve(data);
			}).catch(function (error) {
				deferred.reject(error);
			});
		return deferred.promise;
	},
	onStop: function (environment) {
		var deferred = Q.defer();
		onStop(environment)
			.then(function (data) {
				deferred.resolve(data);
			}).catch(function (error) {
				deferred.reject(error);
			});
		return deferred.promise;
	},
	start: function (environment) {
		var start = new Date();
		var deferred = Q.defer();
		var keepAlive = true;
		FFmpeg._videoStream = new PassThrough();
		try {
			Synchronization.on('spawnSuccess')
				.then(function (data) {
					deferred.resolve(FFmpeg._videoStream);
				})
				.catch(function (error) {});
			FFmpeg._process = FFmpeg._spawn(FFmpeg._cmd, FFmpeg.args(environment), FFmpeg.options());
			SwitchPipe.start(environment).pipe(FFmpeg._process.stdio[0])
				.on('close', function (code, signal) {})
				.on('end', function (code, signal) {})
				.on('error', function (error) {});
			FFmpeg._process
				.on('error', function (error) {
					onError('input: failed to spawn cmd FFmpeg', error);
					deferred.reject(error);
				})
				.on('exit', function (code, signal) {
					onExit('input: exit');
					deferred.reject(code);
				})
				.on('disconnect', function (code, signal) {
					onDebug('input: disconnect');
					deferred.reject(code);
				})
				.on('close', function (code, signal) {
					onDebug('input: close');
					if (keepAlive && !forceStop) {
						FFmpeg.start();
					}
					deferred.reject(code);
				});
			FFmpeg._process.stdio[1].pipe(Processing.setStream(environment, SwitchPipe))
				.on('close', function (code, signal) {
					onDebug('input: stdio[1] close');
					deferred.reject(code);
				})
				.on('end', function (code, signal) {
					onDebug('input: stdio[1] end');
					deferred.reject(code);
				})
				.on('error', function (error) {
					onError('input: stdio[1] error', error);
					deferred.reject(error);
				});
			FFmpeg._process.stdio[2]
				.on('data', function (data) {});
			FFmpeg._process.stdio[3].pipe(FFmpeg._videoStream)
				.on('close', function (code, signal) {
					onDebug('input: stdio[3] close');
					deferred.reject(code);
				})
				.on('end', function (code, signal) {
					onDebug('input: stdio[3] end');
					deferred.reject(code);
				})
				.on('error', function (error) {
					onError('input: stdio[3] error', error);
					deferred.reject(error);
				});
		} catch (error) {
			deferred.reject(error)
		}
		return deferred.promise;
	},
	stop: function (environment) {
		var deferred = Q.defer();
		if (FFmpeg._process) {
			FFmpeg._process.kill();
			FFmpeg._process = null;
			Processing.stop(environment);
			deferred.resolve();
		} else {
			deferred.reject();
		}
		return deferred.promise;
	}
};

// export module 'input_FFmpeg'
module.exports = FFmpeg;