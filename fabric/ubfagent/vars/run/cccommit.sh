#!/bin/bash
# Script to instantiate chaincode
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7006
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export ORDERER_ADDRESS=172.23.61.246:7018
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer1.nic.com/tls/ca.crt
SID=$(peer lifecycle chaincode querycommitted -C channel1 -O json \
  | jq -r '.chaincode_definitions|.[]|select(.name=="property")|.sequence' || true)

if [[ -z $SID ]]; then
  SEQUENCE=1
else
  SEQUENCE=$((1+$SID))
fi

peer lifecycle chaincode commit -o $ORDERER_ADDRESS --channelID channel1 \
  --name property --version 1.2 --sequence $SEQUENCE \
  --peerAddresses 172.23.61.246:7011 \
  --tlsRootCertFiles /vars/discover/channel1/panchayat-com/tlscert \
  --peerAddresses 172.23.61.246:7009 \
  --tlsRootCertFiles /vars/discover/channel1/revenue-com/tlscert \
  --peerAddresses 172.23.61.246:7008 \
  --tlsRootCertFiles /vars/discover/channel1/judiciary-com/tlscert \
  --peerAddresses 172.23.61.246:7007 \
  --tlsRootCertFiles /vars/discover/channel1/bank-com/tlscert \
  --cafile $ORDERER_TLS_CA --tls
