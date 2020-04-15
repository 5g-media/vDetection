/**
 * @file Provides the module 'rest'.
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
 * @module rest
 */
module.exports = {
  /**
   * @function getResponseBody
   * @description Returns an object (response body)
   * @param {Integer} code - the HTTP code
   * @param {String} msg - the message
   * @param {Object} data - the requested data
   * @returns {Object}
   */
  getResponseBody: function (code, msg, data) {
    return {
      status: {
        code: code,
        msg: msg
      },
      data: data
    }
  }
};