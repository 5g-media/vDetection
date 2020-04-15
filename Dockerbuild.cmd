@echo off
REM Build 5G-MEDIA vDetection Service

:vdetection
SET IMG_NAME=vdetection
SET IMG_ATT=-e DEBUG=false -p 9995:9995 --rm
SET IMG_CMD=

GOTO :build

:build
echo Remove container %IMG_NAME%...
docker stop %IMG_NAME%
docker rm %IMG_NAME%
echo Remove image %IMG_NAME%...
docker rmi %IMG_NAME%
echo Build image %IMG_NAME%...
docker build -t %IMG_NAME% .
REM echo Create container %IMG_NAME%...
REM docker run --name %IMG_NAME% %IMG_ATT% %IMG_NAME% %IMG_CMD%
REM echo Save image %IMG_NAME%...
REM docker save -o %IMG_NAME%.tar %IMG_NAME%
REM echo Load image %IMG_NAME%...
REM docker load -i %IMG_NAME%.tar

IF %IMG_NAME%==vdetection GOTO :EOF
ELSE GOTO :vdetection