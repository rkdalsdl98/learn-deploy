FROM node:16

WORKDIR /usr/src/app/

RUN apt update; \
apt install -y redis-server nano curl git locales;

# Dockerize 설치
ENV DOCKERIZE_VERSION v0.2.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
&& tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# 언어 추가
RUN localedef -i ko_KR -f UTF-8 ko_KR.UTF-8; \
localedef -i en_US -f UTF-8 en_US.UTF-8;

ENV LANG en_US.utf8

COPY . .

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ./docker-entrypoint.sh