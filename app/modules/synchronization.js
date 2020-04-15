/**
 * @file Provides the module 'synchronization'.
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
 * @module synchronization
 * @requires node_modules:q
 * @requires modules:websocket
 */

'use strict';

// require 'dotenv' with environment constants and variables
require('dotenv').config();

// require modules
const Q = require("q");

// require and prepare synchronization
const OutputSyncUSE = (process.env.OUTPUT_SYNC_USE.toLowerCase() == 'true') || false;
const OutputSyncTypes = process.env.OUTPUT_SYNC_ENUM_TYPES.toLowerCase().split(',');
const OutputSyncType = (OutputSyncTypes.indexOf(process.env.OUTPUT_SYNC_TYPE.toLowerCase()) > -1) ? process.env.OUTPUT_SYNC_TYPE.toLowerCase() : 'websocket';
const OutputSyncWorker = require('./' + OutputSyncType);
const OutputSyncNAME = process.env.OUTPUT_SYNC_NAME || 'synchronization';

/**
 * @constructs Synchronization
 * @description constructs an synchronization object.
 * @param {Function} init - the init function.
 * @param {Function} sync - the sync function.
 * @param {Function} on - the on function.
 * @param {Function} info - the info function.
 * @fires OutputSyncWorker:init
 * @fires OutputSyncWorker:sync
 * @fires OutputSyncWorker:on
 * @fires OutputSyncWorker:info
 */
var Synchronization = {
	init: function (server) {
		var deferred = Q.defer();
		if (OutputSyncUSE) {
			OutputSyncWorker.init(server)
				.then(function () {
					deferred.resolve();
				})
				.catch(function () {
					deferred.reject();
				});
		} else {
			deferred.reject();
		}
		return deferred.promise;
	},
	sync: function (data, channel) {
		var deferred = Q.defer();
		if (OutputSyncUSE) {
			var ch = (channel) ? channel : OutputSyncNAME;
			OutputSyncWorker.sync(ch, data)
				.then(function (data) {
					deferred.resolve(data);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
		} else if (channel && channel !== OutputSyncNAME) {
			OutputSyncWorker.sync(channel, data)
				.then(function (data) {
					deferred.resolve(data);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
		} else {
			deferred.reject();
		}
		return deferred.promise;
	},
	on: function (channel, customServer) {
		var deferred = Q.defer();
		var ch = (channel) ? channel : OutputSyncNAME;
		OutputSyncWorker.on(ch, customServer)
			.then(function (data) {
				deferred.resolve(data);
			})
			.catch(function (err) {
				deferred.reject(err);
			});
		return deferred.promise;
	},
	info: function (channel) {
		if (OutputSyncUSE) {
			var ch = (channel) ? channel : OutputSyncNAME;
			return OutputSyncWorker.info(OutputSyncType, ch);
		} else {
			return null;
		}
	}
};

// export module 'synchronization'
module.exports = Synchronization;