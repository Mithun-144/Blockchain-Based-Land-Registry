#!/bin/bash
cd $FABRIC_CFG_PATH
# cryptogen generate --config crypto-config.yaml --output keyfiles
configtxgen -profile OrdererGenesis -outputBlock genesis.block -channelID systemchannel

configtxgen -printOrg bank-com > JoinRequest_bank-com.json
configtxgen -printOrg judiciary-com > JoinRequest_judiciary-com.json
configtxgen -printOrg municipal-com > JoinRequest_municipal-com.json
configtxgen -printOrg panchayat-com > JoinRequest_panchayat-com.json
configtxgen -printOrg revenue-com > JoinRequest_revenue-com.json
configtxgen -printOrg sro-com > JoinRequest_sro-com.json
