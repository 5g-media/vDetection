/**
 * @file Provides the module 'environment-schema'.
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
 * @module environment-schema
 */

'use strict';

/**
 * @constructs EnvironmentSchema
 * @description Base schema of an environment - object
 * @property {String} id - The identifier of the environment object.
 */
var EnvironmentSchema = {
  definitions: {
    /**
     * @constructs SynchronizationSchema
     * @description Base schema of an synchronization - object
     * @property {Boolean} active - The active flag of the synchronization object.
     * @property {String} prot - The protocol value of the synchronization object.
     * @property {String} host - The host value of the synchronization object.
     * @property {Number} port - The port value of the synchronization object.
     * @property {String} base - The base value of the synchronization object.
     * @property {String} name - The name value of the synchronization object.
     */
    SynchronizationSchema: {
      type: 'object',
      properties: {
        'active': {
          type: 'boolean',
          default: false
        },
        'prot': {
          type: 'string'
        },
        'host': {
          type: 'string'
        },
        'port': {
          type: 'number'
        },
        'base': {
          type: 'string'
        },
        'name': {
          type: 'string'
        }
      }
    },
    /**
     * @constructs ScaleSchema
     * @description Base schema of an scale - object
     * @property {Boolean} active - The active flag of the scale object.
     * @property {Number} height - The height value of the scale object.
     * @property {Number} width - The width value of the scale object.
     */
    ScaleSchema: {
      type: 'object',
      properties: {
        'active': {
          type: 'boolean',
          default: false
        },
        'height': {
          type: 'number'
        },
        'width': {
          type: 'number'
        }
      }
    },
    /**
     * @constructs InputSettingsSchema
     * @description Base schema of an inputSettings - object
     * @property {String} loglevel - The loglevel value of the inputSettings object.
     * @property {Number} fps - The fps value of the inputSettings object.
     * @property {ScaleSchema} scale - The scale object of the inputSettings object.
     */
    InputSettingsSchema: {
      type: 'object',
      properties: {
        'loglevel': {
          type: 'string',
          enum: [
            'quiet',
            'info',
            'warning',
            'fatal',
            'debug'
          ],
          default: 'quiet'
        },
        'fps': {
          type: 'number'
        },
        'scale': {
          '$ref': '#/definitions/ScaleSchema'
        }
      }
    },
    /**
     * @constructs InputSourceSchema
     * @description Base schema of an source - object
     * @property {String} prot - The protocol value of the source object.
     * @property {String} host - The host value of the source object.
     * @property {Number} port - The port value of the source object.
     * @property {String} base - The base value of the source object.
     * @property {String} url - The url of the source object.
     * @property {Number} pipe - The pipe port/value of the source object.
     */
    InputSourceSchema: {
      type: 'object',
      properties: {
        'prot': {
          type: 'string'
        },
        'host': {
          type: 'string'
        },
        'port': {
          type: 'number'
        },
        'base': {
          type: 'string'
        },
        'url': {
          type: 'string'
        },
        'pipe': {
          type: 'number'
        }
      }
    },
    /**
     * @constructs InputSchema
     * @description Base schema of an input - object
     * @property {SynchronizationSchema} synchronization - The synchronization object of the input object.
     * @property {InputSettingsSchema} settings - The settings object of the input object.
     * @property {InputSourceSchema} source - The source object of the input object.
     */
    InputSchema: {
      type: 'object',
      properties: {
        'synchronization': {
          '$ref': '#/definitions/SynchronizationSchema'
        },
        'settings': {
          '$ref': '#/definitions/InputSettingsSchema'
        },
        'source': {
          '$ref': '#/definitions/InputSourceSchema'
        }
      }
    },
    /**
     * @constructs ServeSchema
     * @description Base schema of an serve - object
     * @property {Boolean} active - The active flag of the serve object.
     * @property {String} frmt - The format value of the serve object.
     * @property {String} prot - The protocol value of the serve object.
     * @property {String} host - The host value of the serve object.
     * @property {Number} port - The port value of the serve object.
     * @property {String} base - The base value of the serve object.
     * @property {String} url - The url value of the serve object.
     */
    ServeSchema: {
      type: 'object',
      properties: {
        'active': {
          type: 'boolean',
          default: false
        },
        'frmt': {
          type: 'string'
        },
        'prot': {
          type: 'string'
        },
        'host': {
          type: 'string'
        },
        'port': {
          type: 'number'
        },
        'base': {
          type: 'string'
        },
        'url': {
          type: 'string'
        }
      }
    },
    /**
     * @constructs InternalSchema
     * @description Base schema of an internal - object
     * @property {ServeSchema} serve - The serve object of the internal object.
     */
    InternalSchema: {
      type: 'object',
      properties: {
        'serve': {
          '$ref': '#/definitions/ServeSchema'
        }
      }
    },
    /**
     * @constructs ProcessingSettingsSchema
     * @description Base schema of an processingSettings - object
     * @property {String} type - The type value of the processingSettings object.
     * @property {Number} fps - The fps value of the processingSettings object.
     */
    ProcessingSettingsSchema: {
      type: 'object',
      properties: {
        'type': {
          type: 'string',
          enum: [
            'face-detection',
            'face-recognition'
          ],
          default: 'face-recognition'
        },
        'fps': {
          type: 'number',
          enum: [
            1,
            5,
            10,
            15,
            20,
            25,
            30
          ],
          default: 15
        }
      }
    },
    /**
     * @constructs DetectionSchema
     * @description Base schema of an detection - object
     * @property {String} cascade_classifier - The cascade_classifier value of the detection object.
     * @property {Number} confidence_min - The confidence_min value of the detection object.
     */
    DetectionSchema: {
      type: 'object',
      properties: {
        'cascade_classifier': {
          type: 'string',
          enum: [
            'HAAR_FRONTALFACE_ALT',
            'HAAR_FRONTALFACE_ALT2',
            'HAAR_FRONTALFACE_ALT_TREE',
            'HAAR_PROFILEFACE',
            'LBP_FRONTALFACE',
            'LBP_PROFILEFACE'
          ],
          default: 'HAAR_FRONTALFACE_ALT2'
        },
        'confidence_min': {
          type: 'number',
          min: 1,
          max: 100,
          default: 1
        }
      }
    },
    /**
     * @constructs RecognitionSchema
     * @description Base schema of an recognition - object
     * @property {String[]} labels - The labels list of the recognition object.
     * @property {Number} distance_max - The distance_max value of the recognition object.
     */
    RecognitionSchema: {
      type: 'object',
      properties: {
        'labels': {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        'distance_max': {
          type: 'number',
          default: 500
        }
      }
    },
    /**
     * @constructs DrawSchema
     * @description Base schema of an draw - object
     * @property {Object} line - The line object of the draw object.
     * @property {Number} line.r - The r value of the draw line object.
     * @property {Number} line.g - The g value of the draw line object.
     * @property {Number} line.b - The b value of the draw line object.
     * @property {Number} line.thickness - The thickness value of the draw line object.
     * @property {Object} text - The text object of the draw object.
     * @property {Number} text.r - The r value of the draw text object.
     * @property {Number} text.g - The g value of the draw text object.
     * @property {Number} text.b - The b value of the draw text object.
     * @property {Number} text.size - The size value of the draw text object.
     * @property {Number} text.thickness - The thickness value of the draw text object.
     * @property {Number} text.alpha - The alpha value of the draw text object.
     */
    DrawSchema: {
      type: 'object',
      properties: {
        'line': {
          type: 'object',
          properties: {
            'r': {
              type: 'number',
              default: 0
            },
            'g': {
              type: 'number',
              default: 0
            },
            'b': {
              type: 'number',
              default: 0
            },
            'thickness': {
              type: 'number',
              default: 1
            }
          }
        },
        'text': {
          type: 'object',
          properties: {
            'r': {
              type: 'number',
              default: 0
            },
            'g': {
              type: 'number',
              default: 0
            },
            'b': {
              type: 'number',
              default: 0
            },
            'size': {
              type: 'number',
              default: 1
            },
            'thickness': {
              type: 'number',
              default: 1
            },
            'alpha': {
              type: 'number',
              default: 0
            }
          }
        }
      }
    },
    /**
     * @constructs ProcessingSchema
     * @description Base schema of an processing - object
     * @property {ProcessingSettingsSchema} synchronization - The settings object of the processing object.
     * @property {DetectionSchema} settings - The detection object of the processing object.
     * @property {RecognitionSchema} stream - The recognition object of the processing object.
     * @property {DrawSchema} pipe - The draw object of the processing object.
     */
    ProcessingSchema: {
      type: 'object',
      properties: {
        'settings': {
          '$ref': '#/definitions/ProcessingSettingsSchema'
        },
        'detection': {
          '$ref': '#/definitions/DetectionSchema'
        },
        'recognition': {
          '$ref': '#/definitions/RecognitionSchema'
        },
        'draw': {
          '$ref': '#/definitions/DrawSchema'
        }
      }
    },
    /**
     * @constructs OutputSettingsSchema
     * @description Base schema of an outputSettings - object
     * @property {String} loglevel - The loglevel value of the outputSettings object.
     * @property {Object} image - The image object of the outputSettings object.
     * @property {String} image.type - The type value of the outputSettings image object.
     * @property {Number} image.width - The width value of the outputSettings image object.
     * @property {Number} image.height - The height value of the outputSettings image object.
     * @property {Object} video - The video object of the outputSettings object.
     * @property {String} video.type - The type value of the outputSettings video object.
     * @property {Number} video.width - The width value of the outputSettings video object.
     * @property {Number} video.height - The height value of the outputSettings video object.
     */
    OutputSettingsSchema: {
      type: 'object',
      properties: {
        'loglevel': {
          type: 'string',
          enum: [
            'quiet',
            'info',
            'warning',
            'fatal',
            'debug'
          ],
          default: 'quiet'
        },
        'image': {
          type: 'object',
          properties: {
            'type': {
              type: 'string',
              enum: [
                'jpg',
                'png'
              ],
              default: 'png'
            },
            'width': {
              type: 'number'
            },
            'height': {
              type: 'number'
            }
          }
        },
        'video': {
          type: 'object',
          properties: {
            'type': {
              type: 'string',
              enum: [
                'avc1',
                'h264',
                'mp4v'
              ],
              default: 'mp4v'
            },
            'width': {
              type: 'number'
            },
            'height': {
              type: 'number'
            }
          }
        }
      }
    },
    /**
     * @constructs LocalSchema
     * @description Base schema of an local - object
     * @property {Object} image - The type value of the local object.
     * @property {Boolean} image.active - The active flag of the local image object.
     * @property {String} image.path - The path value of the local image object.
     * @property {String} image.filename - The filename value of the local image object.
     * @property {String} image.fileextension - The fileextension value of the local image object.
     * @property {Object} video - The fps value of the local object.
     * @property {Boolean} video.active - The active flag of the local video object.
     * @property {String} video.path - The path value of the local video object.
     * @property {String} video.filename - The filename value of the local video object.
     * @property {String} video.fileextension - The fileextension value of the local video object.
     */
    LocalSchema: {
      type: 'object',
      properties: {
        'image': {
          type: 'object',
          properties: {
            'active': {
              type: 'boolean',
              default: false
            },
            'path': {
              type: 'string'
            },
            'filename': {
              type: 'string'
            },
            'fileextension': {
              type: 'string'
            }
          }
        },
        'video': {
          type: 'object',
          properties: {
            'active': {
              type: 'boolean',
              default: false
            },
            'path': {
              type: 'string'
            },
            'filename': {
              type: 'string'
            },
            'fileextension': {
              type: 'string'
            }
          }
        }
      }
    },
    /**
     * @constructs OutputSchema
     * @description Base schema of an output - object
     * @property {SynchronizationSchema} synchronization - The synchronization object of the output object.
     * @property {OutputSettingsSchema} settings - The settings object of the output object.
     * @property {LocalSchema} stream - The local object of the output object.
     * @property {ServeSchema} pipe - The serve object of the output object.
     */
    OutputSchema: {
      type: 'object',
      properties: {
        'synchronization': {
          '$ref': '#/definitions/SynchronizationSchema'
        },
        'settings': {
          '$ref': '#/definitions/OutputSettingsSchema'
        },
        'local': {
          '$ref': '#/definitions/LocalSchema'
        },
        'serve': {
          '$ref': '#/definitions/ServeSchema'
        }
      }
    }
  },
  type: 'object',
  properties: {
    'timestamp': {
      type: 'number'
    },
    'elapsed': {
      type: 'number'
    },
    'config': {
      type: 'object',
      properties: {
        'input': {
          '$ref': '#/definitions/InputSchema'
        },
        'interal': {
          '$ref': '#/definitions/InternalSchema'
        },
        'processing': {
          '$ref': '#/definitions/ProcessingSchema'
        },
        'output': {
          '$ref': '#/definitions/OutputSchema'
        }
      }
    }
  }
};

module.exports = EnvironmentSchema;
