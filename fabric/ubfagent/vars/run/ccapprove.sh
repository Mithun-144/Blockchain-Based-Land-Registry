#!/bin/bash
# Script to approve chaincode
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7006
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export ORDERER_ADDRESS=172.23.61.246:7020
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer3.nic.com/tls/ca.crt

peer lifecycle chaincode queryinstalled -O json | jq -r '.installed_chaincodes | .[] | select(.package_id|startswith("property_1.2:"))' > ccstatus.json

PKID=$(jq '.package_id' ccstatus.json | xargs)
REF=$(jq '.references.channel1' ccstatus.json)

SID=$(peer lifecycle chaincode querycommitted -C channel1 -O json \
  | jq -r '.chaincode_definitions|.[]|select(.name=="property")|.sequence' || true)
if [[ -z $SID ]]; then
  SEQUENCE=1
elif [[ -z $REF ]]; then
  SEQUENCE=$SID
else
  SEQUENCE=$((1+$SID))
fi


export CORE_PEER_LOCALMSPID=bank-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/bank.com/peers/peer1.bank.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/bank.com/users/Admin@bank.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7007

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.bank-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi

export CORE_PEER_LOCALMSPID=judiciary-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/judiciary.com/peers/peer1.judiciary.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/judiciary.com/users/Admin@judiciary.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7008

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.judiciary-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi

export CORE_PEER_LOCALMSPID=municipal-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/municipal.com/peers/peer1.municipal.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/municipal.com/users/Admin@municipal.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7010

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.municipal-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi

export CORE_PEER_LOCALMSPID=panchayat-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/panchayat.com/peers/peer1.panchayat.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/panchayat.com/users/Admin@panchayat.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7011

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.panchayat-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi

export CORE_PEER_LOCALMSPID=revenue-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/revenue.com/peers/peer1.revenue.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/revenue.com/users/Admin@revenue.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7009

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.revenue-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi

export CORE_PEER_LOCALMSPID=sro-com
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp
export CORE_PEER_ADDRESS=172.23.61.246:7006

# approved=$(peer lifecycle chaincode checkcommitreadiness --channelID channel1 \
#   --name property --version 1.2 --init-required --sequence $SEQUENCE --tls \
#   --cafile $ORDERER_TLS_CA --output json | jq -r '.approvals.sro-com')

# if [[ "$approved" == "false" ]]; then
  peer lifecycle chaincode approveformyorg --channelID channel1 --name property \
    --version 1.2 --package-id $PKID \
    --sequence $SEQUENCE -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA
# fi
