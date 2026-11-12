#!/bin/bash
set -e

cd ~/.servers/ubfagent

# 1. Fix signature-policy quoting in ccapprove.sh
sed -i "s|--signature-policy .*|--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" \\\\|g" vars/run/ccapprove.sh

# 2. Cleanly set version to 2.11 and sequence to 14 in cccommit.sh
sed -i 's/--version [^ ]*/--version 2.11/g' vars/run/cccommit.sh
sed -i 's/--sequence [^ ]*/--sequence 14/g' vars/run/cccommit.sh

# 3. Add signature-policy to cccommit.sh if missing
if ! grep -q "signature-policy" vars/run/cccommit.sh; then
  sed -i "s/--cafile \$ORDERER_TLS_CA --tls/--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" --cafile \$ORDERER_TLS_CA --tls/" vars/run/cccommit.sh
fi

echo ">>> Approving chaincode 2.11 across all 6 peers..."
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/ccapprove.sh

echo ">>> Committing chaincode definition on channel1 (Sequence 14)..."
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/cccommit.sh

echo ">>> SUCCESS! Chaincode property_2.11 (Sequence 14) is officially committed!"
