# vDetection

1. [Description](#Description)
2. [Installation](#Installation)
3. [Usage](#Usage)
4. [Environment](#Environment)
5. [Training data for face-recognition](#Training-data-for-face-recognition)
6. [Running vDetection with sample data locally](#Running-vDetection-with-sample-data-locally)
7. [See also](#See-also)
8. [Licence](#Licence)

## Description

[5G-MEDIA](http://www.5gmedia.eu/) vDetection for [Remote and Smart Media Production Incorporating User-generated Content](http://www.5gmedia.eu/use-cases/remote-and-smart-media-production-incorporating-user-generated-content/) detects objects ( *faces* ) in media files - like images, static or streaming video - based on Node.js, express, FFmpeg, opencv4nodejs, OpenCV, TensorFlow and socket<span></span>.io

## Installation

### Requirements

* [git](https://git-scm.com)
* [Node.js](https://nodejs.org/en/download/package-manager/)
* [CMake](https://cmake.org/download/)
* additional for Ubuntu ( Linux ): [build-essential](https://packages.ubuntu.com/bionic/build-essential)
* additional for Windows: [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) via npm
* [FFmpeg](https://github.com/FFmpeg/FFmpeg)

#### *Example for Ubuntu ( Linux ):*

Run the following commands to install the requirements.

```bash
> sudo apt-get update
> sudo apt-get upgrade
> curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
> sudo apt-get install -y build-essential git nodejs cmake ffmpeg
```

#### *Example for Windows:*

Run the following command to install the requirement `windows-build-tools` after git, Node.js, CMake and FFmpeg has been installed.

```bash
> npm install -global windows-build-tools
```

#### *If OpenCV is already installed or build manually:*

* [OpenCV](https://github.com/opencv)
* [OpenCV extra modules](https://github.com/opencv/opencv_contrib)

For a manual build of OpenCV please disable autobuild by setting the following environment variable:  
`OPENCV4NODEJS_DISABLE_AUTOBUILD=1`

#### *Optional for development or demonstration purposes*

* [OBS Studio](https://github.com/obsproject/obs-studio)
* [Docker](https://www.docker.com)
* [Docker-nginx-rtmp](https://github.com/JasonRivers/Docker-nginx-rtmp)

### Checkout process

The process of building OpenCV with extra modules may take some time.

```bash
> git clone `git@github.com:BitTubes/5gmedia-vdetection.git`
> cd 5gmedia-vdetection
> npm install
```

### Check if tools are available

```bash
> npm -v
> ffmpeg -version
```

### Setup environment

Setup the environment variables in `.env` file. For further information please see the section `Environment` below.

### Run manager with

```bash
> node server.js
```

or

```bash
> npm start
```

### Run vDetection on Node.js with pm2

#### *Requirements for Node.js with pm2*

* [pm2](https://pm2.io/doc/en/runtime/overview/)
* [pm2-logrotate](https://github.com/keymetrics/pm2-logrotate)

```bash
> pm2 start pm2.json
```

#### View the logs with pm2

```bash
> pm2 logs vdetection
```

### Run vDetection with docker

#### *Requirements for docker*

* [docker](https://docs.docker.com/install/overview/)

#### Build the vDetection with docker

```bash
> docker build -t 5gmedia-vdetection .
```

#### Run the vDetection with docker

```bash
> docker run \
    --name 5gmedia-vdetection \
    -p '3145:3145/tcp' \
    -p '5001:5001/udp' \
    -d 5gmedia-vdetection
```

##### Run the vDetection with custom environment variables without rebuild container

Please add `--env` with `key=value`, all available environment variables listed in `.env` file. Example below shows starting docker container with vDetection and custom source of mediastream on `rtmp://192.168.0.1:1935/live/stream`

```bash
> docker run \
    --name 5gmedia-vdetection \
    --env INPUT_STREAM_SOURCE_PROT='rtmp' \
    --env INPUT_STREAM_SOURCE_HOST='192.168.0.1' \
    --env INPUT_STREAM_SOURCE_PORT=1935 \
    --env INPUT_STREAM_SOURCE_BASE='/live/stream' \
    -p '3145:3145/tcp' \
    -p '5001:5001/udp' \
    -d 5gmedia-vdetection
```

### Run vDetection with docker-compose

Part of the vDetection docker-compose setup is a docker container running a _rtmp_-server listening on `rtmp://{container-ip}:1935/live/stream`. Please use tools like OBS or FFmpeg to stream media to _rtmp_. The _vDetection_ container per default awaits mediastream from the docker container _rtmp_.

#### *Requirements for docker-compose*

* [docker-compose](https://docs.docker.com/compose/install/)

#### Build the vDetection with docker-compose

```bash
> docker-compose build
```

#### Run the vDetection with docker-compose

```bash
> docker-compose up -d
```

#### View the logs with docker-compose

```bash
> docker-compose logs
```

or

```bash
> docker-compose logs -f
```

## Usage

vDetection provides an API to start and stop the detection process. The start process can be optionally config the detection with custom variables. For further information please see the section `Environment` below.

### *Example of start:*

```bash
curl -X POST "http://localhost:3145/rest/detections/start" -H "accept: application/json" -H "Content-Type: application/json" -d "{}"
```

### *Example of start with custom variables:*

```bash
curl -X POST "http://localhost:3145/rest/detections/start" -H "accept: application/json" -H "Content-Type: application/json" -d "{ \"config\": { \"input\": { \"source\": { \"url\": \"rtmp://192.168.0.1:1935/live/stream\" } }, \"output\": { \"serve\": { \"url\": \"rtp://192.168.0.1:5001/detection/demo\" } } }}"
```

### *Example of stop:*

```bash
curl -X POST "http://localhost:3145/rest/detections/stop" -H "accept: application/json"
```

### Swagger

vDetection comes with Swagger-DOC and Swagger-UI. Please set the environment variables `SWAGGER_DOC_USE` and/or `SWAGGER_UI_USE` as `true` in the `.env`-file to activate Swagger. With docker and docker-compose both variables can be overwritten after the container build process.

#### *Example for docker:*

```bash
> docker run \
    --name 5gmedia-vdetection \
    ...
    --env SWAGGER_DOC_USE=true \
    --env SWAGGER_UI_USE=true \
    ...
    -p '3145:3145/tcp' \
    -p '5001:5001/udp' \
    -d 5gmedia-vdetection
```

#### *Example for docker-compose*

```bash
  ...
  vdetection:
    container_name: '5gmedia_vdetection'
    network_mode: host
    build: ./
    environment:
      - SWAGGER_DOC_USE=true
      - SWAGGER_UI_USE=true
  ...
```

## Environment

In order to configure vDetection open and edit the `.env` file in the root directory.

* ~~`NODE_ENV`~~

* `APP_PORT` - port of vDetection

* `LOG_LEVEL_ENUM` - list of available log-levels
* `LOG_LEVEL` - log-level

* `SWAGGER_DOC_USE` - flag whether Swagger Doc is available via http://localhost:3145/doc/swagger
* ~~`SWAGGER_DOC_PATH`~~
* `SWAGGER_UI_USE` - flag whether Swagger UI is available via http://localhost:3145

* ~~`REVERSE_PROXY_USE`~~
* ~~`REVERSE_PROXY_PROT`~~
* ~~`REVERSE_PROXY_HOST`~~
* ~~`REVERSE_PROXY_PORT`~~
* ~~`REVERSE_PROXY_BASE`~~

* ~~`AUTH_USER_ENUM_ROLES`~~

* ~~`AUTH_REST_USE`~~
* ~~`AUTH_REST_PROT`~~
* ~~`AUTH_REST_HOST`~~
* ~~`AUTH_REST_PORT`~~
* ~~`AUTH_REST_BASE`~~
* ~~`AUTH_REST_TTL`~~
* ~~`AUTH_REST_MIN_ROLE`~~

* `INPUT_SYNC_USE` - flag whether input synchronization is used (default: true)
* `INPUT_SYNC_ENUM_TYPES` - list of input synchronization types
* `INPUT_SYNC_TYPE` - input synchronization type
* `INPUT_SYNC_PROT` - input synchronization protocoll
* `INPUT_SYNC_HOST` - input synchronization host
* `INPUT_SYNC_PORT` - input synchronization port
* `INPUT_SYNC_BASE` - input synchronization base
* `INPUT_SYNC_NAME` - input synchronization channel name

* `INPUT_SETTINGS_LOG_LEVEL_ENUM` - list of input log-levels
* `INPUT_SETTINGS_LOG_LEVEL` - input log-level (default: quiet)
* `INPUT_SETTINGS_FPS` - input frames per second *fps* (default: 25)
* `INPUT_SETTINGS_SCALE_USE` - flag whether scale resolution of input (default: false)
* `INPUT_SETTINGS_SCALE_WIDTH` - scale width of input (default: -1)
* `INPUT_SETTINGS_SCALE_HEIGHT` - scale height of input (default: 1080)

* `INPUT_STREAM_SOURCE_PROT` - input source protocoll
* `INPUT_STREAM_SOURCE_HOST` - input source host
* `INPUT_STREAM_SOURCE_PORT` - input source port
* `INPUT_STREAM_SOURCE_BASE` - input source base

* `INPUT_PIPE_SOURCE_PORT` - input source pipe port (default: 0)

* ~~`INTERNAL_SERVE_USE`~~
* ~~`INTERNAL_SERVE_PROT`~~
* ~~`INTERNAL_SERVE_HOST`~~
* ~~`INTERNAL_SERVE_PORT`~~
* ~~`INTERNAL_SERVE_BASE`~~

* `PROCESSING_SETTINGS_ENUM_TYPES` - list of processing types
* `PROCESSING_SETTINGS_TYPE` - processing type (default: face-recognition)
* `PROCESSING_SETTINGS_ENUM_FPS` - list of processing fps
* `PROCESSING_SETTINGS_FPS` - processing fps (default: 15)

* `PROCESSING_DETECTION_CASCADE_CLASSIFIER_ENUM_TYPES` - list of processing detection cascade classifier types
* `PROCESSING_DETECTION_CASCADE_CLASSIFIER_TYPE` - processing detection cascade classifier (default: HAAR_FRONTALFACE_ALT2)
* `PROCESSING_DETECTION_CONFIDENCE_MIN` - processing detection minimal confidence in percentage (default: 10, best and max: 100%)

* `PROCESSING_RECOGNITION_ASSETS_PATH` - path to folder with training set of images (default: assets/image)
* `PROCESSING_RECOGNITION_ASSETS_FILE_ENUM_TYPES` - list of file-extensions
* `PROCESSING_RECOGNITION_ASSETS_FILE_TYPE` - file-extension to lookup (default: jpg)
* `PROCESSING_RECOGNITION_DISTANCE_MAX` - processing recognition maximal distance (default: 200, best and min: 0)

* `PROCESSING_DRAWING_LINE_COLOR_R` - colorcode R of lines
* `PROCESSING_DRAWING_LINE_COLOR_G` - colorcode G of lines
* `PROCESSING_DRAWING_LINE_COLOR_B` - colorcode B of lines
* `PROCESSING_DRAWING_LINE_THICKNESS` - thickness of lines
* `PROCESSING_DRAWING_TEXT_COLOR_R` - colorcode R of text
* `PROCESSING_DRAWING_TEXT_COLOR_G` - colorcode G of text
* `PROCESSING_DRAWING_TEXT_COLOR_B` - colorcode B of text
* `PROCESSING_DRAWING_TEXT_BACKGROUND_ALPHA` - alphacode of grey-background of textbox

* `OUTPUT_SYNC_USE` - flag whether output synchronization is used (default: true)
* `OUTPUT_SYNC_ENUM_TYPES` - list of output synchronization types
* `OUTPUT_SYNC_TYPE` - output synchronization type
* `OUTPUT_SYNC_PROT` - output synchronization protocoll
* `OUTPUT_SYNC_HOST` - output synchronization host
* `OUTPUT_SYNC_PORT` - output synchronization port
* `OUTPUT_SYNC_BASE` - output synchronization base
* `OUTPUT_SYNC_NAME` - output synchronization channel name

* `OUTPUT_SETTINGS_LOG_LEVEL_ENUM` - list of output log-levels
* `OUTPUT_SETTINGS_LOG_LEVEL` - input log-level (default: quiet)
* `OUTPUT_SETTINGS_IMAGE_ENUM_TYPES` - list of output image types
* `OUTPUT_SETTINGS_IMAGE_TYPE` - output image type *frames* (default: png), png will cause overlay and jpg will stack detection with original stream below
* `OUTPUT_SETTINGS_IMAGE_RESOLUTION_WIDTH` - output image resolution width (default: 1280)
* `OUTPUT_SETTINGS_IMAGE_RESOLUTION_HEIGHT` - output image resolution height (default: 720)
* `OUTPUT_SETTINGS_VIDEO_ENUM_TYPES` - list of output video types
* `OUTPUT_SETTINGS_VIDEO_TYPE` - 4 character code of video type (default: mp4v)
* `OUTPUT_SETTINGS_VIDEO_RESOLUTION_WIDTH` - output video resolution width (default: 1280)
* `OUTPUT_SETTINGS_VIDEO_RESOLUTION_HEIGHT` - output video resolution height (default: 720)

* `OUTPUT_LOCAL_IMAGE_USE` - flag whether processing images will be saved locally (default: false)
* `OUTPUT_LOCAL_IMAGE_PATH` - path to save images
* `OUTPUT_LOCAL_IMAGE_FILENAME` - file-name
* `OUTPUT_LOCAL_IMAGE_FILEEXTENSION` - file-extension
* `OUTPUT_LOCAL_VIDEO_USE` - flag whether processing images will be saved locally as video (default: false)
* `OUTPUT_LOCAL_VIDEO_PATH` - path to save video
* `OUTPUT_LOCAL_VIDEO_FILENAME` - file-name
* `OUTPUT_LOCAL_VIDEO_FILEEXTENSION` - file-extension

* `OUTPUT_SERVE_USE` - flag whether output video will be served (default: true)
* `OUTPUT_SERVE_FRMT` - FFmpeg format for flag `-f`
* `OUTPUT_SERVE_PROT` - output serve protocoll
* `OUTPUT_SERVE_HOST` - output serve host
* `OUTPUT_SERVE_PORT` - output serve port
* `OUTPUT_SERVE_BASE` - output serve base

### Custom Environment variables

vDetection actually supports the following custom variables:

```JSON
{
  "config": {
    "input": {
      "source": {
        "url": "rtmp://192.168.0.1:1935/live/stream"
      }
    },
    "processing": {
      "settings": {
        "fps": 10
      }
    },
    "output": {
      "settings": {
        "image": {
          "type": "png",
          "width": 1280,
          "height": 720
        },
        "video": {
          "type": "mp4v",
          "width": 1280,
          "height": 720
        }
      },
      "serve": {
        "frmt": "rtp_mpegts",
        "url": "rtp://192.168.0.1:5001/detection/demo"
      }
    }
  }
}
```

## Training data for face-recognition

In order to train the face-recognition algorithm based on a training dataset of images, please reference to the folder with those images in the `.env` file as `PROCESSING_RECOGNITION_ASSETS_PATH` and define which files with specific fileextension should be loaded by setting `PROCESSING_RECOGNITION_ASSETS_FILE_TYPE`.

* `PROCESSING_RECOGNITION_ASSETS_PATH` - path to folder with training set of images (default: assets/image)
* `PROCESSING_RECOGNITION_ASSETS_FILE_TYPE` - file-extension to lookup (default: jpg)

### *Source*

All images should have a square image resolution, e.g. 32x32. Please see the example images within the subfolder `assets/image`. At startup of vDetection the images will be loaded from the given folder and processed as training data for the algorithm.

### *Labels*

The labels for tagging the detections/recognitions will be automatically generated. Labels will be generated from the filename and regular expression - only characters will be kept and all numbers, whitespaces, etc. will be removed.

#### *Examples*

* `sheldon001.jpg` will become the label _sheldon_
* `amy_123.jpg` will become the label _amy_
* `Leonard-Leakey-Hofstadter-1.jpg` will become the label _LeonardLeakeyHofstadter_
* `1-penny 1.jpg` will become the label _penny_

## Running vDetection with sample data locally

For testing purposes this git repository comes with sample data in the folder `assets`. The subfolder `video` contains a sample video and `images` contains training data as *jpg* or *png*. This scenario is meant for quick testing without a `rtmp-server` and `OBS` as streaming source. Please initialize and start vDetection locally with Node.js and npm, start the process with a HTTP-POST request to the API and listen with a mediaplayer with network capabilities, e.g. VLC.

__*Example for Linux:*__

```bash
> sudo apt-get update
> sudo apt-get upgrade

> curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
> sudo apt-get install -y build-essential git nodejs cmake ffmpeg

> git clone `git@github.com:BitTubes/5gmedia-vdetection.git`
> cd 5gmedia-vdetection
> npm install

> npm start
```

Please use the vDetection internal Swagger, another terminal with curl or a HTTP-REST client, e.g. [Insomnia](https://insomnia.rest/), and send this POST request with the following JSON body:

```JSON
{
  "config": {
    "input": {
      "source": {
        "url": "assets/video/TBBT01.mp4"
      }
    },
    "output": {
      "settings": {
        "image": {
          "type": "jpg"
        }
      },
      "serve": {
        "frmt": "rtp_mpegts",
        "url": "rtp:// < own local ip > :5001/detection/demo"
      }
    }
  }
}
```

to activate Swagger set/change the following variables in the `.env` file:

```bash
SWAGGER_DOC_USE=true
SWAGGER_UI_USE=true
```

please visit http://localhost:3145 to explore Swagger. Open `[POST] /rest/detections/start`, click on `Try it out` and replace the content of the Formuar field `body` with the JSON above. To send the request click the button `Execute`.

The request should be similar to the following example:

```bash
> curl -X POST "http://localhost:3145/rest/detections/start" -H  "accept: application/json" -H  "Content-Type: application/json" -d "{\"config\": {\"input\": {\"source\": {\"url\": \"assets/video/TBBT01.mp4\"} }, \"output\": {\"settings\": {\"image\": {\"type\": \"jpg\"} }, \"serve\": {\"frmt\": \"rtp_mpegts\", \"url\": \"rtp:// < own local ip > :5001/detection/demo\"} } } }"
```

vDetection will now start consuming the Video in the subfolder assets/video and serve the result via `rtp:// < own local ip > :5001/detection/demo`. With the parameter `config.output.setting.image.type` set to `jpg` the output video will be a stacked video with the vDetection video including tagging boxes on top and the original video above, setting the parameter to `png` will overlay both videos.

In order to see the video please use a media player with network copabillities, e.g. [VLC](https://www.videolan.org/vlc/), and open `rtp:// < own local ip > :5001/detection/demo` as network stream/media.

## See also

* [Documentation](https://github.com/BitTubes/5gmedia-vdetection/blob/master/docs/index.html) [JSDoc]
* [Swagger-UI](http://localhost:3145/) [localhost]
* [Swagger-DOC](http://localhost:3145/doc/swagger) [localhost]

## Licence

[![Creative Commons License](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-sa/4.0/)  
This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).