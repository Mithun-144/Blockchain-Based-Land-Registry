#!/bin/bash
# Script to create channel block 0 and then create channel
cp $FABRIC_CFG_PATH/core.yaml /vars/core.yaml
cd /vars
export FABRIC_CFG_PATH=/vars
configtxgen -profile OrgChannel \
  -outputCreateChannelTx channel1.tx -channelID channel1

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7006
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export ORDERER_ADDRESS=172.23.61.246:7019
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer2.nic.com/tls/ca.crt
peer channel create -c channel1 -f channel1.tx -o $ORDERER_ADDRESS \
  --cafile $ORDERER_TLS_CA --tls
