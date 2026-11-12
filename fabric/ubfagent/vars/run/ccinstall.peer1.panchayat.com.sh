#!/bin/bash
# Script to install chaincode onto a peer node
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7011
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/panchayat.com/peers/peer1.panchayat.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=panchayat-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/panchayat.com/users/Admin@panchayat.com/msp
cd /go/src/github.com/chaincode/property


if [ ! -f "property_node_1.2.tar.gz" ]; then
  peer lifecycle chaincode package property_node_1.2.tar.gz \
    -p /go/src/github.com/chaincode/property/node/ \
    --lang node --label property_1.2
fi

peer lifecycle chaincode install property_node_1.2.tar.gz
