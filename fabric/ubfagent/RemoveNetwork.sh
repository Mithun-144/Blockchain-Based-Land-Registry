#!/bin/sh

docker kill $(docker ps -q)
docker rm $(docker ps -aq)
docker rmi -f $(docker images -a -q)
#docker rmi $(docker images "pbft-*" -q)
#docker rmi $(docker images "poet-*" -q)
