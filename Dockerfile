#
# vDetection Dockerfile
#
# Author: Truong-Sinh An
# Created 01.12.2019

# docker rmi -f vdetection
# docker build -t vdetection .
# docker run --name vdetection -p 9995:9995 --rm vdetection
# docker run --name vdetection -e DEBUG=true -p 9995:9995 --rm vdetection

FROM ubuntu:18.04 AS build

WORKDIR     /opt

COPY        . .

RUN \
            apt-get update -y && \
            apt-get install -y --no-install-recommends curl gnupg gcc g++ make apt-transport-https ca-certificates build-essential wget && \
            # curl -sL https://deb.nodesource.com/setup_10.x | bash && \
            curl -sL https://deb.nodesource.com/setup_12.x | bash && \
            apt-get install -y nodejs && \
            npm install --production && \
            apt-get autoremove -y && \
            apt-get clean -y

FROM ubuntu:18.04 AS release

WORKDIR     /opt

CMD         nodejs index.js
#CMD         ["index.js"]
#ENTRYPOINT  ["nodejs"]

COPY        --from=build /opt/ .

EXPOSE      9995

RUN \
            apt-get update -y && \
            apt-get install -y --no-install-recommends curl gnupg gcc g++ make apt-transport-https lsb-release ca-certificates && \
            # curl -sL https://deb.nodesource.com/setup_10.x | bash && \
            curl -sL https://deb.nodesource.com/setup_12.x | bash && \
            apt-get install -y nodejs && \
            apt-get autoremove -y && \
            apt-get clean -y && \
            rm -rf /var/lib/apt/lists/*
