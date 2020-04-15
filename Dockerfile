#
# 5gmedia-vdetection Dockerfile
#
# Author: Truong-Sinh An
# Created 12.04.2019
# See https://docs.docker.com/get-started/part2/#dockerfile

# docker rmi 5gmedia-vdetection

# docker build -t 5gmedia-vdetection .

# docker run \
#   --name 5gmedia-vdetection \
#   --env INPUT_STREAM_SOURCE_PROT='rtmp' \
#   --env INPUT_STREAM_SOURCE_HOST='192.168.0.1' \
#   --env INPUT_STREAM_SOURCE_PORT=1935 \
#   --env INPUT_STREAM_SOURCE_BASE='/live/stream' \
#   -p '3145:3145/tcp' \
#   -p '5001:5001/udp' \
#   -p '5002:5002/tcp' \
#   -d 5gmedia-vdetection

# docker run \
#   --name 5gmedia-vdetection \
#   --env INPUT_STREAM_SOURCE_PROT='rtmp' \
#   --env INPUT_STREAM_SOURCE_HOST='192.168.0.1' \
#   --env INPUT_STREAM_SOURCE_PORT=1935 \
#   --env INPUT_STREAM_SOURCE_BASE='/live/stream' \
#   -p '3145:3145/tcp' \
#   -p '5001:5001/udp' \
#   -p '5002:5002/tcp' \
#   -it 5gmedia-vdetection /bin/bash

# Use the official ubuntu (18.04) runtime as a parent image
FROM ubuntu:18.04

# Use the ffmpeg container based on ubuntu (18.04) as a parent image
# FROM jrottenberg/ffmpeg:4.1

ENV DEBIAN_FRONTEND noninteractive

# Install the basic things
RUN apt-get update \
  && apt-get install -y \
    apt-utils \
    sudo \
    autoconf \
    automake \
    curl \
    build-essential \
    git \
    cmake \
    wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install nodejs
RUN mkdir -p ~/ffmpeg_sources \
  && cd ~/ffmpeg_sources \
  && wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
  && tar xvf ffmpeg-release-amd64-static.tar.xz \
  && cd ffmpeg-4.1.3-amd64-static/ \
  && cp ffmpeg /usr/bin/ffmpeg \
  && cp ffmpeg /usr/share/ffmpeg

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
RUN apt-get install -y nodejs

# Copy related files
COPY . /opt/

# Set the working directory
WORKDIR /opt/

# Install service
RUN npm install

# Expose port 3145 5001 5002
EXPOSE 3145 5001 5002

# Run service forever
# CMD [ "npm", "start" ]
CMD node server.js

ENV DEBIAN_FRONTEND teletype