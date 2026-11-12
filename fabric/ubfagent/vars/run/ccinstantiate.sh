#!/bin/bash
# Script to instantiate chaincode
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7006
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export ORDERER_ADDRESS=172.23.61.246:7020
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer3.nic.com/tls/ca.crt

