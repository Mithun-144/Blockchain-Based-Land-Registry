#!/bin/bash
# Script to join a peer to a channel
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7008
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/judiciary.com/peers/peer1.judiciary.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=judiciary-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/judiciary.com/users/Admin@judiciary.com/msp
export ORDERER_ADDRESS=172.23.61.246:7018
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer1.nic.com/tls/ca.crt
if [ ! -f "channel1.genesis.block" ]; then
  peer channel fetch oldest -o $ORDERER_ADDRESS --cafile $ORDERER_TLS_CA \
  --tls -c channel1 /vars/channel1.genesis.block
fi

peer channel join -b /vars/channel1.genesis.block \
  -o $ORDERER_ADDRESS --cafile $ORDERER_TLS_CA --tls
