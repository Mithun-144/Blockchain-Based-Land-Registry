# Hyperledger Fabric Chaincode Deployment Guide (VM 192.168.231.128)

This guide provides the exact terminal commands to transfer updated smart contract code from your local machine to the Ubuntu VM and deploy it onto the live 6-peer network on `channel1`.

---

## 📌 Network & Version Parameters

- **VM Host:** `192.168.231.128`
- **VM User:** `admin1`
- **Minifabric Workspace on VM:** `~/.servers/ubfagent`
- **Chaincode Name:** `property`
- **Chaincode Language:** `node`
- **Currently Deployed Version:** `2.5` (Sequence `9`) ✅ *With Cryptographic Root-of-Title Audit & Encumbrance Certification*
- **Previous Deployed Version:** `2.3` (Sequence `8`)
- **Next Upgrade Version:** `2.6`
- **Next Upgrade Sequence:** `10`
- **Channel:** `channel1`
- **Endorsement Policy:** `MAJORITY` (Requires at least 4 of 6 peer signatures)

---

## Step 1: Copy Chaincode from Local Machine to VM (`scp`)

Run this command in **PowerShell** or **Git Bash** on your local machine:

### If running from Project Root (`c:\Users\mithu\Downloads\NBF-Lite`):
```powershell
# Copy only lib, index.js, and package.json (DO NOT copy node_modules)
scp -r chaincode/property-contract/lib chaincode/property-contract/index.js chaincode/property-contract/package.json admin1@192.168.231.128:~/.servers/ubfagent/vars/chaincode/property/node/
```

### If running from `app/` Directory (`c:\Users\mithu\Downloads\NBF-Lite\app`):
```powershell
scp -r ../chaincode/property-contract/lib ../chaincode/property-contract/index.js ../chaincode/property-contract/package.json admin1@192.168.231.128:~/.servers/ubfagent/vars/chaincode/property/node/
```

> ⚠️ **CRITICAL NOTE:** Never copy `node_modules` into `vars/chaincode/property/node/`. Minifab/Fabric packages everything in that folder into a tarball. If `node_modules` is included, the package exceeds hundreds of megabytes, causing gRPC timeout failures during `peer lifecycle chaincode install`. Fabric builds `node_modules` automatically inside Docker.

---

## Step 2: SSH into VM & Clean Temp Files

```bash
ssh admin1@192.168.231.128
cd ~/.servers/ubfagent

# Ensure no stale node_modules or package-lock exist in the source dir
rm -rf vars/chaincode/property/node/node_modules vars/chaincode/property/node/package-lock.json
```

---

## Step 3: Fast Deployment via Minifabric (Recommended)

Run the single-line Minifabric upgrade command specifying the new version `2.6` and sequence `12`:

```bash
cd ~/.servers/ubfagent
./minifab ccup -n property -l node -v 2.6 -s 12 -p ''
```

*(Note: If a sequence was already used in a previous commit attempt, simply increment `-s`).*

Minifabric will automatically:
1. Package the chaincode as `property_2.6`.
2. Install it on all 6 peer nodes (`peer1.sro.com`, `peer1.bank.com`, `peer1.judiciary.com`, `peer1.revenue.com`, `peer1.municipal.com`, `peer1.panchayat.com`).
3. Approve the definition across all 6 organizations at Sequence 12.
4. Commit the new chaincode definition on `channel1`.
5. Initialize/spin up the 6 new Docker containers: `dev-peer1.*.com-property_2.6-...`.

---

## Step 4: Step-by-Step Manual Lifecycle (If Minifab Halts on Sequence)

If Minifabric throws an approval policy conflict or halts on already-installed peers, execute the manual Fabric Lifecycle sequence below:

### 4.1. Package Chaincode
```bash
cd ~/.servers/ubfagent

docker run --rm -v $(pwd)/vars:/vars hyperledger/fabric-tools:2.2.3 \
  peer lifecycle chaincode package /vars/property_2.4.tar.gz \
  --path /vars/chaincode/property/node \
  --lang node \
  --label property_2.4
```

### 4.2. Calculate Package ID
```bash
PACKAGE_ID=$(docker run --rm -v $(pwd)/vars:/vars hyperledger/fabric-tools:2.2.3 \
  peer lifecycle chaincode calculatepackageid /vars/property_2.4.tar.gz)

echo "PACKAGE_ID: $PACKAGE_ID"
```

### 4.3. Install on All 6 Peer Nodes
```bash
for org in sro bank judiciary revenue municipal panchayat; do
  echo ">>> Installing on peer1.$org.com ..."
  docker exec \
    -e CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/$org.com/users/Admin@$org.com/msp \
    -e CORE_PEER_ADDRESS=peer1.$org.com:7001 \
    -e CORE_PEER_LOCALMSPID=$org-com \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/$org.com/peers/peer1.$org.com/tls/ca.crt \
    peer1.$org.com peer lifecycle chaincode install /vars/property_2.4.tar.gz
done
```

### 4.4. Approve for All 6 Organizations (Sequence 9)
```bash
for org in sro bank judiciary revenue municipal panchayat; do
  echo ">>> Approving for $org-com (Sequence 9) ..."
  docker exec \
    -e CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/$org.com/users/Admin@$org.com/msp \
    -e CORE_PEER_ADDRESS=peer1.$org.com:7001 \
    -e CORE_PEER_LOCALMSPID=$org-com \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/$org.com/peers/peer1.$org.com/tls/ca.crt \
    peer1.$org.com peer lifecycle chaincode approveformyorg \
    -o orderer1.nic.com:7000 \
    --ordererTLSHostnameOverride orderer1.nic.com \
    --tls --cafile /vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer1.nic.com/msp/tlscacerts/tlsca.nic.com-cert.pem \
    --channelID channel1 \
    --name property \
    --version 2.4 \
    --package-id $PACKAGE_ID \
    --sequence 9
done
```

### 4.5. Commit on `channel1`
```bash
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/sro.com/users/Admin@sro.com/msp \
  -e CORE_PEER_ADDRESS=peer1.sro.com:7001 \
  -e CORE_PEER_LOCALMSPID=sro-com \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt \
  peer1.sro.com peer lifecycle chaincode commit \
  -o orderer1.nic.com:7000 \
  --ordererTLSHostnameOverride orderer1.nic.com \
  --tls --cafile /vars/keyfiles/ordererOrganizations/nic.com/orderers/orderer1.nic.com/msp/tlscacerts/tlsca.nic.com-cert.pem \
  --channelID channel1 \
  --name property \
  --version 2.4 \
  --sequence 9 \
  --peerAddresses peer1.sro.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/sro.com/peers/peer1.sro.com/tls/ca.crt \
  --peerAddresses peer1.bank.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/bank.com/peers/peer1.bank.com/tls/ca.crt \
  --peerAddresses peer1.judiciary.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/judiciary.com/peers/peer1.judiciary.com/tls/ca.crt \
  --peerAddresses peer1.revenue.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/revenue.com/peers/peer1.revenue.com/tls/ca.crt \
  --peerAddresses peer1.municipal.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/municipal.com/peers/peer1.municipal.com/tls/ca.crt \
  --peerAddresses peer1.panchayat.com:7001 --tlsRootCertFiles /vars/keyfiles/peerOrganizations/panchayat.com/peers/peer1.panchayat.com/tls/ca.crt
```

---

## Step 5: Verification & Live Code Inspection

### 5.1. Check Running Chaincode Containers
```bash
docker ps --filter "name=dev-peer1.*property_2.4"
```

### 5.2. Inspect Live Chaincode Source in Container
To verify the exact code running inside the active chaincode Docker container on the peer node:
```bash
docker exec $(docker ps -q --filter "name=dev-peer1.sro.com-property" | head -n 1) cat /usr/local/src/lib/propertyContract.js
```

### 5.3. Test Invocation via REST API
```bash
curl -X POST http://localhost:4000/fabric/v1/invokecc \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "generateEncumbranceCertificate",
    "args": ["PROP001"],
    "user": "registrar@sro.com",
    "ccname": "property",
    "channel": "channel1",
    "cfgpath": "/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json",
    "local": true,
    "mspId": "sro-com"
  }'
```

---

## ⚠️ Troubleshooting & Known Gotchas

### 1. `Error: chaincode install failed with status: 500 - chaincode already successfully installed`
- **Cause:** Minifabric labels packages as `<ccname>_<version>` (e.g. `property_2.4`). If a package with that label was already installed previously on any peer, Hyperledger Fabric rejects re-installing under the identical package label. Minifabric will halt before reaching approve/commit.
- **Fix:** Always bump the version string by one minor step (e.g., from `2.4` to `2.5`). Run:
  ```bash
  ./minifab ccup -n property -l node -v 2.5 -s 9 -p ''
  ```

### 2. `stat local "chaincode/property-contract/...": No such file or directory` (SCP Error)
- **Cause:** Your PowerShell prompt is in `app/` rather than the repository root.
- **Fix:** Use relative paths from `app/`:
  ```powershell
  scp -r ../chaincode/property-contract/lib ../chaincode/property-contract/index.js ../chaincode/property-contract/package.json admin1@192.168.231.128:~/.servers/ubfagent/vars/chaincode/property/node/
  ```

### 3. `Error response from daemon: No such container: cli`
- **Cause:** Minifabric runs its CLI tools container ephemerally (`--rm`), meaning the `cli` container automatically terminates once Minifab finishes its task.
- **Fix:** Do not rely on `docker exec cli`. To inspect the active smart contract directly, query the live peer chaincode container:
  ```bash
  docker exec $(docker ps -q --filter "name=dev-peer1.sro.com-property" | head -n 1) cat /usr/local/src/lib/propertyContract.js
  ```

### 4. `InitCmd -> ERRO 001 Cannot run peer because cannot init crypto, specified path "/vars/keyfiles/...": no such file or directory`
- **Cause:** Attempting to run `peer lifecycle` inside `docker exec peer1.sro.com` directly. Peer containers do not have the host's `/vars` directory mounted to root `/vars`.
- **Fix:** Let `./minifab ccup` orchestrate the install, approve, and commit lifecycle, or mount `/vars` using `docker run --rm -v $(pwd)/vars:/vars hyperledger/fabric-tools:2.2.3`.

### 5. `/vars/run/ccapprove.sh: line 40: syntax error near unexpected token ')'` + `chaincode definition not agreed to by this org (bank-com)`

This is a **two-part bug** in Minifabric's generated scripts:

**Part A — Signature policy escaping bug in `ccapprove.sh`:**
- **Cause:** Minifabric's Jinja template escapes single quotes inside single-quoted strings (`'OR(\'org1\')'`), which is invalid bash syntax.
- **Fix:**
  ```bash
  sed -i "s|--signature-policy .*|--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" \\\\|g" ~/.servers/ubfagent/vars/run/ccapprove.sh

  # Verify:
  grep -A1 "signature-policy" ~/.servers/ubfagent/vars/run/ccapprove.sh | head -3
  # Should show: --signature-policy "OR('sro-com.member',...)" \
  ```

**Part B — Wrong version hardcoded in `cccommit.sh`:**
- **Cause:** Minifabric writes the previously-committed version into `cccommit.sh` instead of the new version. The approve scripts use the correct version (`2.6`), but the commit script doesn’t — causing Fabric to report each org as "not agreed".
- **Fix:**
  ```bash
  # Fix version to 2.6
  sed -i 's/--version 2.[0-9]/--version 2.6/g' ~/.servers/ubfagent/vars/run/cccommit.sh

  # Add signature-policy to commit if missing (must match what was approved)
  if ! grep -q "signature-policy" ~/.servers/ubfagent/vars/run/cccommit.sh; then
    sed -i "s/--cafile \$ORDERER_TLS_CA --tls/--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" --cafile \$ORDERER_TLS_CA --tls/" ~/.servers/ubfagent/vars/run/cccommit.sh
  fi
  ```

**Run both scripts via fabric-tools on the correct Docker network (`nbf-lite_default`):**
```bash
# Find Docker network name first:
docker network ls   # Look for: nbf-lite_default

# Run approve (should print 6 VALID txids — one per org)
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/ccapprove.sh

# Run commit
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/cccommit.sh
```

> ⚠️ **Note:** Peer hostnames (`peer1.sro.com:7001`) are NOT reachable from the fabric-tools container. The scripts use IP addresses (`192.168.231.128:7006`) which ARE reachable — do not change them.


