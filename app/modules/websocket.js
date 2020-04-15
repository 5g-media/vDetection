/**
 * @file Provides the module 'websocket'.
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
 * @module websocket
 * @requires node_modules:q
 * @requires node_modules:socker.io
 * @requires node_modules:socket.io-client
 */

'use strict';

// require modules
const Q = require("q");

// require and prepare websocket
const InputSyncPROT = process.env.OUTPUT_SYNC_PROT || 'http';
const InputSyncHOST = process.env.OUTPUT_SYNC_HOST || 'localhost';
const InputSyncPORT = process.env.OUTPUT_SYNC_PORT || 3145;
const InputSyncBASE = process.env.OUTPUT_SYNC_BASE || '';
const InputSyncURL = InputSyncPROT + '://' + InputSyncHOST + ':' + InputSyncPORT + InputSyncBASE;
const OutputSyncPROT = process.env.OUTPUT_SYNC_PROT || 'http';
const OutputSyncHOST = process.env.OUTPUT_SYNC_HOST || 'localhost';
const OutputSyncPORT = process.env.OUTPUT_SYNC_PORT || 3145;
const OutputSyncBASE = process.env.OUTPUT_SYNC_BASE || '';
const OutputSyncURL = OutputSyncPROT + '://' + OutputSyncHOST + ':' + OutputSyncPORT + OutputSyncBASE;

/**
 * @constructs Websocket
 * @description constructs a websocket object.
 * @param {Integer} _port - the port.
 * @param {Object} _server - the server.
 * @param {Object} _client - the client.
 * @param {Object} _service - the service.
 * @param {Function} setPort - the setter function, sets the port.
 * @param {Function} port - the getter function, gets the port.
 * @param {Function} setServer - the setter function, sets the server.
 * @param {Function} server - the getter function, gets the server.
 * @param {Function} setClient - the setter function, sets the client.
 * @param {Function} client - the getter function, gets the client.
 * @param {Function} setService - the setter function, sets the service.
 * @param {Function} service - the getter function, gets the service.
 * @param {Function} init - the init function.
 * @param {Function} sync - the sync function.
 * @param {Function} on - the on function.
 * @param {Function} info - the info function.
 * @fires socket.io:emit
 */
var Websocket = {
  _port: null,
  _server: null,
  _client: null,
  _service: null,
  setPort: function (port) {
    return Websocket._port = port;
  },
  port: function () {
    return Websocket._port;
  },
  setServer: function (server) {
    return Websocket._server = server;
  },
  server: function () {
    return Websocket._server;
  },
  setClient: function () {
    return Websocket._client = require('socket.io-client');
  },
  client: function () {
    return Websocket._client;
  },
  setService: function (server) {
    return Websocket._service = require('socket.io').listen(server);
  },
  service: function () {
    return Websocket._service;
  },
  init: function (server) {
    var deferred = Q.defer();
    try {
      Websocket.setPort(server.address().port);
      Websocket.setServer(server);
      Websocket.setClient();
      Websocket.setService(server);
      Websocket.service()
        .on('connection', function (socket) {
          socket.on('disconnect', function () {});
          deferred.resolve(socket);
        });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },
  sync: function (channel, data) {
    var deferred = Q.defer();
    try {
      Websocket.service().of('/').clients(function (err, clients) {
        if (err) {
          deferred.reject(err);
        } else if (clients.length > 0) {
          Websocket.service().emit(channel, data);
          deferred.resolve();
        } else {
          deferred.reject('no clients');
        }
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },
  on: function (channel, customServer) {
    var deferred = Q.defer();
    try {
      var server = (customServer) ? customServer : InputSyncURL;
      const socket = Websocket.client()(server, {
        forceNew: true
      });
      socket.on(channel, function (data) {
        deferred.resolve(data);
        socket.close();
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },
  info: function (type, channel) {
    try {
      return {
        type: type,
        channel: channel
      };
    } catch (err) {}
  }
};

// export module 'websocket'
module.exports = Websocket;