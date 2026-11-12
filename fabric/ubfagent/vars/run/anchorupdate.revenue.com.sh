#!/bin/bash
# Script to instantiate chaincode
cp $FABRIC_CFG_PATH/core.yaml /vars/core.yaml
cd /vars
export FABRIC_CFG_PATH=/vars

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=172.23.61.246:7009
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/revenue.com/peers/peer1.revenue.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=revenue-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/revenue.com/users/Admin@revenue.com/msp
export ORDERER_ADDRESS=172.23.61.246:7020
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer3.nic.com/tls/ca.crt

# 1. Fetch the channel configuration
peer channel fetch config config_block.pb -o $ORDERER_ADDRESS \
  --cafile $ORDERER_TLS_CA --tls -c channel1

# 2. Translate the configuration into json format
configtxlator proto_decode --input config_block.pb --type common.Block \
  | jq .data.data[0].payload.data.config > channel1_current_config.json
echo "--<<-->>--"

# 3. Update the current config in json with the organization anchor peer we want to add
jq '.channel_group.groups.Application.groups."revenue-com".values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "172.23.61.246","port": 7009}]},"version": "0"}}' channel1_current_config.json > channel1_modified_anchor_config.json

# 4. Translate the current config in json format to protobuf format
configtxlator proto_encode --input channel1_current_config.json \
  --type common.Config --output config.pb

# 5. Translate the desired config in json format to protobuf format
configtxlator proto_encode --input channel1_modified_anchor_config.json \
  --type common.Config --output modified_config.pb

# 6. Calculate the delta of the current config and desired config
configtxlator compute_update --channel_id channel1 \
  --original config.pb --updated modified_config.pb \
  --output channel1_anchor_update.pb

# 7. Decode the delta of the config to json format
configtxlator proto_decode --input channel1_anchor_update.pb \
  --type common.ConfigUpdate | jq . > channel1_anchor_update.json

# 8. Now wrap of the delta config to fabric envelop block
echo '{"payload":{"header":{"channel_header":{"channel_id":"channel1", "type":2}},"data":{"config_update":'$(cat channel1_anchor_update.json)'}}}' | jq . > channel1_anchor_update_envelope.json

# 9. Encode the json format into protobuf format
configtxlator proto_encode --input channel1_anchor_update_envelope.json \
  --type common.Envelope --output channel1_anchor_update_envelope.pb

# 10. Need to sign anchor update envelop by org admin
peer channel update -o $ORDERER_ADDRESS --tls --cafile $ORDERER_TLS_CA \
  -f channel1_anchor_update_envelope.pb -c channel1
