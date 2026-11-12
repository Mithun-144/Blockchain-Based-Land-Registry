#!/bin/sh


echo "$1"

#sudo systemctl start docker.service

case "$1" in
      "certificate")docker-compose -f sawtooth-core/docker/compose/certificate.yaml down
      echo "========================================================"
      echo "-----------------certificate.yaml down------------"
      echo "========================================================"
      ;;
      "insurance")docker-compose -f sawtooth-core/docker/compose/insurance.yaml down
      echo "========================================================"
      echo "-----------------insurance.yaml down ------------"
      echo "========================================================"
      ;;
      "supplychain")docker-compose -f sawtooth-core/docker/compose/supplychain.yaml down
      echo "========================================================"
      echo "-----------------supplychain.yaml down------------"
     echo "========================================================"
esac
