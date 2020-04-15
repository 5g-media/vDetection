/**
 * @file Provides the module 'express_doc'.
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
 * @module express_doc
 * @requires node_modules:express
 */

'use strict';

// define express router 'rest'
var express = require('express');
var router = express.Router();

// define express middleware
router.use(function (req, res, next) {
  next();
});

// define and require routes for router 'doc'
router.use('/', require('../routes/swagger').router);

// export router 'doc'
module.exports = router;