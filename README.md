## vDetection
This project is a service for object detection, face detection and face recognition based on TensorFlow and face-api.js.

## Requirements
- node.js 10.x and higher

## Installation
Change directory where the project files are located.
### Local environment
```
npm install
```
### Docker
```
docker build -t vdetection .
```
## Usage
Run the following command to start the service.
### Local environment
```
node index.js
```
### Docker
To start the *vdetection* service run:
```
docker run --name vdetection -p 9995:9995 --rm vdetection
```
To start the *vdetection* service and change its default configuration run:
```
docker run \
--name vdetection \
-e DEBUG=false \
-e REQ_URL= \
-e REQ_METHOD=POST \
-e USE_GPU=false \
-e USE_RECOGNITION=false \
-e CNN_MODEL=TinyYoloV2 \
-e MIN_CONFIDENCE=0.6 \
-e MAX_DESCRIPTOR_DISTANCE=0.4 \
-e PROCESSING_TIMEOUT=false \
-e USE_AGE_GENDER_EXPRESSIONS=false \
-e EXPRESSION_THRESHOLD=0.75 \
-e WS_PORT=9995 \
-p 9995:9995 \
--rm \
vdetection
```
To remove the container run:
```
docker stop vdetection
```
## Configuration
The configuration of the service must be done in the *.env* file. The following parameters exist:

`DEBUG` - Enable/disable debugging. (default: false)\
`REQ_URL` - Defines the URL to send the detection results as Report after the stream has finished. (default: )\
`REQ_METHOD` - Defines the HTTP method to use for the request. (default: POST)\
`USE_RECOGNITION` - Defines whether the detected objects/faces will run through an additional recognition process for labeling. (default: false)\
`CNN_MODEL` - Defines the CNN Model used for object detection, face detection and face recognition. Supported Models are SSD (Single Shot Multibox Detector) based on MobileNetV1 (SSDMobileNetV1) and  Tiny Yolo V2. (default: TinyYoloV2)\
`MIN_CONFIDENCE` - Defines vdetection service minimum confidence score, each score below this threshold will be dropped. (default: 0.6)\
`MAX_DESCRIPTOR_DISTANCE` - Defines vdetection service maximum distance value with 0 as best/closest, each value higher this threshold will be dropped. (default: 0.4)\
`PROCESSING_TIMEOUT` - Defines vdetection service to limit the processing via timeout. If use timeout the time for process the detection will be 1000ms/{fps}, i.e. 25fps, max timeout time will be 40ms. (default: false)\
`USE_AGE_GENDER_EXPRESSIONS` - Defines vdetection to additionally detect the age, gender and face expressions. (default: false)\
`EXPRESSION_THRESHOLD` - Defines min threshold for face expressions. (default: 0.75)\

`SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_DEFAULT` - Defines the fontsize of SSA ASS V4+ Style Default if video height is <720. (default: 24)\
`SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_DEFAULT` - Defines the fontsize of SSA ASS V4+ Style Default if video height is =720. (default: 32)\
`SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_DEFAULT` - Defines the fontsize of SSA ASS V4+ Style Default if video height is >720. (default: 42)\
`SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_DETECTION` - Defines the fontsize of SSA ASS V4+ Style Detection if video height is <720. (default: 12)\
`SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_DETECTION` - Defines the fontsize of SSA ASS V4+ Style Detection if video height is =720. (default: 18)\
`SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_DETECTION` - Defines the fontsize of SSA ASS V4+ Style Detection if video height is >720. (default: 24)\
`SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_LABEL` - Defines the fontsize of SSA ASS V4+ Style Label if video height is <720. (default: 24)\
`SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_LABEL` - Defines the fontsize of SSA ASS V4+ Style Label if video height is =720. (default: 32)\
`SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_LABEL` - Defines the fontsize of SSA ASS V4+ Style Label if video height is >720. (default: 42)\
`SSA_ASS_VIDEO_HEIGHT_LT_720_FONTSIZE_SUBTITLE` - Defines the fontsize of SSA ASS V4+ Style Subtitle if video height is <720. (default: 24)\
`SSA_ASS_VIDEO_HEIGHT_IS_720_FONTSIZE_SUBTITLE` - Defines the fontsize of SSA ASS V4+ Style Subtitle if video height is =720. (default: 32)\
`SSA_ASS_VIDEO_HEIGHT_GT_720_FONTSIZE_SUBTITLE` - Defines the fontsize of SSA ASS V4+ Style Subtitle if video height is >720. (default: 42)\

`WS_PORT` - Websocket server's port (default: 9995)

## Training data for face-recognition

In order to train the face-recognition algorithm based on a training dataset of images, please copy images of faces of persons of interesst into the subfolder `./assets`.

### *Source*

All images should either be a PNG or JPG. Please see the example images within the subfolder `./assets`. At startup of vDetection the images will be loaded from the given folder and processed as training data for the algorithm.

### *Labels*

The labels for tagging the detections/recognitions will be automatically generated. Labels will be generated from the filename and regular expression - only characters will be kept and all numbers, whitespaces, etc. will be removed.

#### *Examples*

* `sheldon001.jpg` will become the label _sheldon_
* `amy_123.jpg` will become the label _amy_
* `Leonard-Leakey-Hofstadter-1.jpg` will become the label _LeonardLeakeyHofstadter_
* `1-penny 1.jpg` will become the label _penny_
