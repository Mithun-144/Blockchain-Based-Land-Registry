#!/bin/bash
# Script to instantiate chaincode
cp $FABRIC_CFG_PATH/core.yaml /vars/core.yaml
cd /vars
export FABRIC_CFG_PATH=/vars

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7006
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export ORDERER_ADDRESS=172.23.61.246:7018
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer1.nic.com/tls/ca.crt

peer channel fetch config config_block.pb -o $ORDERER_ADDRESS \
  --cafile $ORDERER_TLS_CA --tls -c channel1

configtxlator proto_decode --input config_block.pb --type common.Block \
  | jq .data.data[0].payload.data.config > channel1_config.json