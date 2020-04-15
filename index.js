/**
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
 * @requires node_modules:dotenv
 * @requires node_modules:q
 * @requires node_modules:fs
 * @requires node_modules:http
 * @requires node_modules:request
 * @requires node_modules:websocket-stream
 * @requires node_modules:tensorflow:tfjs-node
 * @requires node_modules:tensorflow:tfjs-node-gpu
 * @requires node_modules:base64-to-uint8array
 * @requires modules:tensorflow/face-detection
 * @requires modules:tensorflow/face-recognition
 */

require('dotenv').config();

const Q = require('q');
const Http = require('http');
const Request = require('request');
const Websocket = require('websocket-stream');
const Fs = require('fs');

// const TF = require('@tensorflow/tfjs-node');
const TF = getTensorFlow();
const Processing = getProcessing();

function getProcessing() {
  const USE_RECOGNITION = JSON.parse(process.env.USE_RECOGNITION);
  if (USE_RECOGNITION) {
    return require('./tensorflow/face-recognition');
  } else {
    return require('./tensorflow/face-detection');
  }
}

function getTensorFlow() {
  const USE_GPU = JSON.parse(process.env.USE_GPU);
  if (USE_GPU) {
    return require('@tensorflow/tfjs-node-gpu');
  } else {
    return require('@tensorflow/tfjs-node');
  }
  // try {
  //   process.env.DECODE_GPU = true;
  //   return require('@tensorflow/tfjs-node-gpu');
  // }
  // catch (e) {
  //   LOG('[vdetection] using CPU, no GPU support');
  //   process.env.DECODE_GPU = false;
  //   return require('@tensorflow/tfjs-node');
  // }
}

const toUint8Array = require('base64-to-uint8array');

///////////// env /////////////

const DEBUG             = JSON.parse(process.env.DEBUG);

const REQ_URL           = process.env.REQ_URL;
const REQ_METHOD        = process.env.REQ_METHOD;
const EXP_THRESHOLD     = JSON.parse(process.env.EXPRESSION_THRESHOLD);
const MAX_DISTANCE      = JSON.parse(process.env.MAX_DESCRIPTOR_DISTANCE);

const WS_PORT           = parseInt(process.env.WS_PORT);

/////////// Debug ////////////

const LOG               = DEBUG ? console.log : () => {};

//////////// Timeout ///////////

let timeoutTimer        = null;
let timeoutTime         = parseInt(process.env.STREAM_TIMEOUT);

///////////// WS /////////////

let TS_0 = null
let TS_1 = null
let TS_2 = null
let VIDEO_WIDTH = null
let VIDEO_HEIGHT = null
let Report = null

const server = Http.createServer();
const wss = Websocket.createServer({
  perMessageDeflate: false,
  server: server,
  binary: true
}, wssHandle);
// wss.on('close', function (data) {
//   LOG('[vdetection] wss on close', data);
// });
// wss.on('error', function (error) {
//   LOG('[vdetection] wss on error', error);
// });

async function init() {
  Report = {};
  Processing.init().then(function (data) {
    LOG('[vdetection] CNNs loading success')
  });
}

function handleBuffer(data) {
  var deferred = Q.defer();
  try {
    const BufferedData = Buffer.from(data, 'base64');
    const ImageArray = toUint8Array(BufferedData);
    const Tensor3d = TF.node.decodeJpeg(ImageArray, 3);
    // LOG('[vdetection] handleBuffer -> Tensor3d:', Tensor3d);
    deferred.resolve(Tensor3d);
  } catch (error) {
    LOG('[vdetection] handleBuffer error:', error);
    deferred.reject(error);
  }
  return deferred.promise;
}

function handleResult(message, results, start, intermediate) {
  var deferred = Q.defer();
  try {
    const id = message.metadata.id;
    const ts = message.timestamp - TS_0
    const RESULT = {
      id,
      ts,
      metadata: message.metadata,
      results,
      intermediate,
      duration: process.hrtime(start)[1] / 1000000
    };
    LOG('[vdetection] handleResult:', RESULT.id, RESULT.results.length, RESULT.intermediate, RESULT.duration);
    // console.log('[vdetection] handleResult:', RESULT.id, RESULT.results.length, RESULT.intermediate, RESULT.duration);
    deferred.resolve(RESULT);
  } catch (error) {
    LOG('[vdetection] handleResult error:', error);
    deferred.reject(error);
  }
  return deferred.promise;
}

function handleReport(data) {
  var deferred = Q.defer();
  try {
    const id = data.id;
    Report[id] = data;
    deferred.resolve(data);
  } catch (error) {
    LOG('[vdetection] handleReport error:', error);
    deferred.reject(error);
  }
  return deferred.promise;
}

function handleEOS() {
  try {
    let data = JSON.stringify(Report, null, 2);
    Fs.writeFile('./output/Report.json', data, (error) => {
      if (error) {
        LOG('[vdetection] handleEOS error:', error);
        process.exit(1);
      }
      reportToASS().then(() => {
        if (
          REQ_URL &&
          REQ_URL.length > 0
        ) {
          // Request({
          //   url: REQ_URL,
          //   method: REQ_METHOD,
          //   json: { 'detections': Report }
          // }, () => {
          //   process.exit(1);
          // });
          const func = REQ_METHOD === 'POST' ? Request.post : Request.put;
          Fs.createReadStream('./output/Objects.ass').pipe(func(REQ_URL, () => {
            TS_2 = Date.now();
            // Report['TS_2'] = TS_2;
            LOG('[vdetection] processing time:', TS_2 - TS_0);
            process.exit(1);
          }));
        } else {
          TS_2 = Date.now();
          // Report['TS_2'] = TS_2;
          LOG('[vdetection] processing time:', TS_2 - TS_0);
          process.exit(1);
        }
      }).catch((error) => {
        LOG('[vdetection] handleEOS error:', error);
        process.exit(1);
      })
    });
  } catch (error) {
    LOG('[vdetection] handleEOS error:', error);
    process.exit(1);
  }
}

function reportToASS() {
  let promise = new Promise((resolve, reject) => {
    Fs.writeFile('./output/Objects.ass', '', (error) => {
      if (error) {
        LOG('[vdetection] reportToASS error:', error);
        reject(error);
      }
      let fontsize_default = (parseInt(VIDEO_HEIGHT) > 720)
        ? process.env.SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_DEFAULT
        : (parseInt(VIDEO_HEIGHT) === 720)
          ? process.env.SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_DEFAULT
          : process.env.SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_DEFAULT
      let fontsize_detection = (parseInt(VIDEO_HEIGHT) > 720)
        ? process.env.SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_DETECTION
        : (parseInt(VIDEO_HEIGHT) === 720)
          ? process.env.SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_DETECTION
          : process.env.SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_DETECTION
      let fontsize_label = (parseInt(VIDEO_HEIGHT) > 720)
        ? process.env.SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_LABEL
        : (parseInt(VIDEO_HEIGHT) === 720)
          ? process.env.SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_LABEL
          : process.env.SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_LABEL
      let fontsize_subtitle = (parseInt(VIDEO_HEIGHT) > 720)
        ? process.env.SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_SUBTITLE
        : (parseInt(VIDEO_HEIGHT) === 720)
          ? process.env.SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_SUBTITLE
          : process.env.SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_SUBTITLE
      let init_ASS = `[Script Info]
Title: object detections
Original Script: BitTubes GmbH
ScriptType: v4.00+
Collisions: Normal
PlayResX:` + VIDEO_WIDTH +
`
PlayResY:` + VIDEO_HEIGHT +
`
PlayDepth: 0
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Detection, Arial, ` + fontsize_detection + `, &HFF000000, &H66000000, &H00B4FCFC, &HFF000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 1, 0, 10, 0, 0, 0, 0
Style: Label, Arial, ` + fontsize_label + `, &H00B4FCFC, &H00B4FCFC, &H00000008, &H80000008, -1, 0, 0, 0, 100, 100, 0, 0, 1, 1, 2, 10, 20, 20, 20, 0
Style: Subtitle, Arial, ` + fontsize_subtitle + `, &H00B4FCFC, &H00B4FCFC, &H00000008, &H80000008, -1, 0, 0, 0, 100, 100, 0, 0, 1, 1, 2, 2, 0, 0, 100, 0
Style: Default, Arial, ` + fontsize_default + `, &H00B4FCFC, &H00B4FCFC, &H00000008, &H80000008, -1, 0, 0, 0, 100, 100, 0, 0, 1, 1, 2, 2, 0, 0, 100, 0

[Events]
`;
      Fs.appendFile('./output/Objects.ass', init_ASS, () => {
        Object.keys(Report).map((key, index, array) => {
          const DetectionObject = Report[key];
          if (
            DetectionObject &&
            DetectionObject.hasOwnProperty('results') &&
            DetectionObject.results.length > 0
          ) {
            const PUFFER = 1000 / DetectionObject.metadata['fps'];
            const TS_START = ptsToHMSC(DetectionObject.metadata['pts_time'] * 1000);
            const TS_STOP = ptsToHMSC((DetectionObject.metadata['pts_time'] * 1000) + PUFFER);
            DetectionObject.results.map((resultObject, index, array) => {
              const BOX_XXX = parseInt(resultObject['detection']['_box']['_x']);
              const BOX_YYY = parseInt(resultObject['detection']['_box']['_y']);
              const BOX_WIDTH = parseInt(resultObject['detection']['_box']['_width']);
              const BOX_HEIGHT = parseInt(resultObject['detection']['_box']['_height']);
              // `
              // Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
              // Dialogue: 1, TS_START, TS_END, Detection, NTP, 0000, 0000, 0000, , {\pos(BOX_XXX, BOX_YYY)\p1}m 0 0 l BOX_WIDTH 0 l BOX_WIDTH BOX_HEIGHT l 0 BOX_HEIGHT{\p0}
              // `
              let extend_Detection_ASS = `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1, ` + TS_START + `, ` + TS_STOP + `, Detection, NTP, 0000, 0000, 0000, , {\\pos(` + BOX_XXX + `, ` + BOX_YYY + `)\\p1}m 0 0 l ` + BOX_WIDTH + ` 0 l ` + BOX_WIDTH + ` ` + BOX_HEIGHT + ` l 0 ` + BOX_HEIGHT + ` {\\p0}
`;
              Fs.appendFileSync('./output/Objects.ass', extend_Detection_ASS);
              if (
                resultObject.hasOwnProperty('gender') ||
                resultObject.hasOwnProperty('age') ||
                resultObject.hasOwnProperty('expressions')
              ) {
                // `
                // Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                // Dialogue: 2, {{TS_START}}, {{TS_END}}, Label, NTP, 0000, 0000, 0000, , TEXT
                // `
                let labels = []
                if (resultObject.gender) {
                  labels.push('Gender: ' + resultObject.gender + ' (' + parseInt(resultObject.genderProbability * 100) + '%)');
                }
                if (resultObject.age) {
                  labels.push('Age: ' + parseFloat(resultObject.age).toFixed(2));
                }
                if (resultObject.expressions) {
                  let expressions = []
                  Object.keys(resultObject.expressions).map((key, index, array) => {
                    if (resultObject.expressions[key] > EXP_THRESHOLD) {
                      expressions.push(key)
                    }
                    if (index === array.length -1) {
                      labels.push('Expressions: ' + expressions.join(', '))
                    }
                  })
                }
                if (resultObject.bestMatch) {
                  if (resultObject.bestMatch._distance <= MAX_DISTANCE) {
                    labels.push('Label: ' + resultObject.bestMatch._label + ' (' + parseFloat(resultObject.bestMatch._distance).toFixed(2) + ')');
                  }
                }
                let extend_Label_ASS = `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1, ` + TS_START + `, ` + TS_STOP + `, Label, NTP, 0000, 0000, 0000, , ` + labels.join('\\N') + `
`;
                Fs.appendFileSync('./output/Objects.ass', extend_Label_ASS);
              }
            })
          }
          if (
            index === array.length -1
          ) {
            resolve();
          }
        });
      });
    });
  });
  return promise;
}

function ptsToHMSC(ms) {
  // const ms = pts * 1000;
  const cc = parseInt(((ms % 1000) / 100) * 10);
  let ss = ms / 1000;
  const hh = parseInt(ss / 3600);
  ss = ss % 3600;
  const mm = parseInt(ss / 60);
  ss = parseInt(ss % 60);
  return (hh + ':' + mm + ':' + ss + '.' + cc);
}

function wssHandle(stream) {
  stream.on('data', function (data) {
    try {
      const MESSAGE = JSON.parse(data);
      if (
        MESSAGE &&
        MESSAGE.hasOwnProperty('buffer') &&
        MESSAGE.buffer &&
        MESSAGE.hasOwnProperty('metadata') &&
        MESSAGE.metadata &&
        TS_0 &&
        typeof TS_0 === 'number'
      ) {
        if (
          MESSAGE.hasOwnProperty('timestamp') &&
          MESSAGE.timestamp &&
          !TS_1
        ) {
          // Set TS_1
          TS_1 = MESSAGE.timestamp;
          // Report['TS_1'] = MESSAGE.timestamp;
          LOG('[vdetection] set TS_1 to: ', TS_1);
        }
        const START = process.hrtime();
        const MAX_TIME = 1000 / parseInt(MESSAGE.metadata.fps);
        const DIMENSION = {
          width: MESSAGE.metadata.video_width,
          height: MESSAGE.metadata.video_height
        };
        if (
          MESSAGE.hasOwnProperty('metadata') &&
          MESSAGE.metadata.hasOwnProperty('video_width') &&
          MESSAGE.metadata.video_width &&
          !VIDEO_WIDTH
        ) {
          VIDEO_WIDTH = MESSAGE.metadata.video_width;
        }
        if (
          MESSAGE.hasOwnProperty('metadata') &&
          MESSAGE.metadata.hasOwnProperty('video_height') &&
          MESSAGE.metadata.video_height &&
          !VIDEO_HEIGHT
        ) {
          VIDEO_HEIGHT = MESSAGE.metadata.video_height;
        }
        // Buffer to frame
        handleBuffer(MESSAGE.buffer).then(function (frame) {
          const INTERMEDIATE = process.hrtime(START)[1] / 1000000;
          // Inference
          Processing.process(frame, MAX_TIME, DIMENSION).then(function (results) {
            frame.dispose();
            handleResult(MESSAGE, results, START, INTERMEDIATE).then(function (data) {
              handleReport(data);
            });
          }).catch(function (error) {
            frame.dispose();
            handleResult(MESSAGE, [], START, INTERMEDIATE);
            LOG('[vdetection] face-detection error:', error);
          });
        }).catch(function (error) {
          LOG('[vdetection] handleBuffer error:', error);
        });
      } else {
        if (
          MESSAGE.hasOwnProperty('timestamp') &&
          MESSAGE.timestamp &&
          !TS_0
        ) {
          // Set TS_0
          TS_0 = MESSAGE.timestamp;
          // Report['TS_0'] = MESSAGE.timestamp;
          LOG('[vdetection] set TS_0 to: ', TS_0);
        } else {
          LOG('[vdetection] data no TS_0 error');
        }
        LOG('[vdetection] data no metadata or buffer error');
      }
      clearTimeout(timeoutTimer);
      timeoutTimer = setTimeout(handleEOS, timeoutTime, true);
    } catch (error) {
      // LOG('[vdetection] wssHandle catch error', error);
    }
  });
  stream.on('error', function (error) {
    LOG('[vdetection] wssHandle on error', error);
  });
  // LOG(JSON.stringify(stream, null, 4));
  LOG(stream);
}

init()
server.listen(WS_PORT);
