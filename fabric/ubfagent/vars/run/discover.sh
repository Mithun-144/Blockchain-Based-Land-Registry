#!/bin/bash
# Script to discover endorsers and channel config
cd /vars

export PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/tls/ca.crt
export ADMINPRIVATEKEY=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp/keystore/priv_sk
export ADMINCERT=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp/signcerts/Admin@sro.com-cert.pem

discover endorsers --peerTLSCA $PEER_TLS_ROOTCERT_FILE \
  --userKey $ADMINPRIVATEKEY \
  --userCert $ADMINCERT \
  --MSP sro-com --channel channel1 \
  --server 172.23.61.246:7006 \
  --chaincode property | jq '.[0]' | \
  jq 'del(.. | .Identity?)' | jq 'del(.. | .LedgerHeight?)' \
  > /vars/discover/channel1_property_endorsers.json

discover config --peerTLSCA $PEER_TLS_ROOTCERT_FILE \
  --userKey $ADMINPRIVATEKEY \
  --userCert $ADMINCERT \
  --MSP sro-com --channel channel1 \
  --server 172.23.61.246:7006 > /vars/discover/channel1_config.json
