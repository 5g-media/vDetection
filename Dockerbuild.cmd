@echo off
REM Build 5G-MEDIA 5gmedia-vdetection

:5gmedia-vdetection
SET IMG_DIR=%~dp0
SET IMG_NAME=5gmedia-vdetection
SET IMG_ATT=-p 3145:3145 -p 5001:5001 -p 5002:5002

GOTO :build

:build
echo %IMG_DIR%
cd %IMG_DIR%
echo stop and rm %IMG_NAME%
docker stop %IMG_NAME%
docker rm %IMG_NAME%
REM echo image prune -a
REM docker image prune -a
echo rmi %IMG_NAME%
docker rmi %IMG_NAME%
echo build -t %IMG_NAME% .
docker build -t %IMG_NAME% .
echo run --name %IMG_NAME% %IMG_ATT% -d %IMG_NAME%
docker run --name %IMG_NAME% %IMG_ATT% -d %IMG_NAME%
docker save -o %IMG_DIR%\%IMG_NAME%.tar %IMG_NAME%
REM docker load -i %IMG_DIR%\%IMG_NAME%.tar

IF %IMG_NAME%==5gmedia-vdetection GOTO :EOF
ELSE GOTO :5gmedia-vdetection