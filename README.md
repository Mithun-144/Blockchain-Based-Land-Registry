# PropChain — Blockchain Property Registry (React + Vite)

A modern, high-performance React application for **Property/Land Title Registration and Ownership Transfer**, architected according to the system flow diagram and integrated with the **NBF-Lite Hyperledger Fabric** blockchain framework.

---

## 🏗️ Architecture & Flow Overview

Built directly from [`Flow Diagram.svg`](./Flow%20Diagram.svg):

```
Citizen Portal → (Gov e-ID Authentication)
       ├── My Properties (view/register titles)
       └── Marketplace (explore & purchase)
                 └── 7-Step Transfer Wizard:
                     1. 🔍 Automated Check (ownership, area, tax clearance)
                     2. ⚖️ Encumbrance Check (mortgages, bank liens)
                     3. 🛡️ Restrictions Check (court orders, zoning)
                     4. 💳 Stamp Duty / Revenue Payment
                     5. ✍️ Digital Signatures (X.509 cryptographic signing)
                     6. 📋 Digital Sale Deed Generation
                     7. 🔗 Ownership Transfer (commit to Hyperledger Fabric)
```

---

## 🚀 Quickstart & Running Locally

### Option 1: Full Docker + Hyperledger Fabric + NBF-Lite Stack (Fresh Clone)

This repository includes [`docker-compose.yml`](./docker-compose.yml), which starts the entire 4-stage stack in dependency order:
1. **Stage 1:** CouchDB (`x6`), Fabric Certificate Authorities (`ca1.*`, `x6`), and MongoDB (`nbf-mongodb`)
2. **Stage 2:** Raft Orderers (`orderer1..3.nic.com`), Endorsing Peers (`peer1.*.com`, `x6`), and `nbf-tools`
3. **Stage 3:** NBF-Lite middleware (`nbf-ubfagent`, `nbf-samplerest` on `:4000`), NBF Academia services & dashboard (`:80`)
4. **Stage 4:** PropChain OTP/Stripe backend (`:3001`) and PropChain web app (`:5173`)

#### Prerequisites
- **Linux** or **Windows 10/11 with WSL2 (Ubuntu)** *(run Compose inside WSL/Linux so `/var/run/docker.sock` and Linux file permissions bind cleanly)*
- **Docker Engine** & **Docker Compose v2**
- **Git**, **Python 3**, `curl`, `jq`

#### Step 1: Download & Extract NBF-Lite (External Binaries & Docker Images)
Compiled NBF Academia Linux binaries and Docker image tarballs (`>50 MB`) are excluded from GitHub via [`.gitignore`](./.gitignore):

1. Download the official **NBF-Lite** archive from the internet and extract it in WSL/Linux (for example, to `~/NBF-Lite`).
2. Load the packaged Docker images from the extracted NBF-Lite folder:
   ```bash
   cd ~/NBF-Lite

   # Load NBF Academia Web Dashboard image (nbf-academia_web)
   docker load -i academia_UI/nbf-academia.tar

   # Load Hyperledger Fabric 2.2.3, CouchDB, CA, and Minifab images
   for img in nbf_c/docker_images/*.tar; do
     docker load -i "$img"
   done
   ```
   > **Important:** Do **not** run NBF-Lite's `./setup.sh` when using Docker Compose — `setup.sh` launches native `pm2` binaries and host `mongod` on ports `:80`, `:27017`, `:4301`, `:4444`, and `:4999–:5050`, which conflict with Compose containers.

#### Step 2: Clone This Repository & Configure `.env` Files
```bash
git clone https://github.com/Mithun-144/Blockchain-Based-Land-Registry.git
cd Blockchain-Based-Land-Registry

cp .env.example .env
cp server/.env.example server/.env
```
- Update `.env` (from [`.env.example`](./.env.example)) so `NBF_LITE_DIR` points to your extracted NBF-Lite folder:
  ```env
  COMPOSE_PROJECT_NAME=nbf-lite
  SERVERS_DIR=./fabric
  NBF_LITE_DIR=/home/<your-user>/NBF-Lite
  ```
- Update `server/.env` (from [`server/.env.example`](./server/.env.example)) with your Gmail SMTP App Password (or leave blank for Demo OTP mode) and Stripe API credentials.

#### Step 3: Generate Fabric Crypto (`vars/keyfiles/`) & Docker Connection Profile
Because Fabric private keys (`fabric/ubfagent/vars/keyfiles/`, `fabric/nbf-samplerest/wallet/`) are gitignored, generate fresh org certificates and channel artifacts on a clean clone:

```bash
# 1. Point spec.yaml to this machine's host/WSL IP
HOST_IP=$(hostname -I | awk '{print $1}')
sed -i "s/endpoint_address:.*/endpoint_address: $HOST_IP/" fabric/ubfagent/spec.yaml

# 2. Stage the property smart contract into Minifab's chaincode directory
mkdir -p fabric/ubfagent/vars/chaincode/property/node
cp -r chaincode/property-contract/{lib,index.js,package.json} \
  fabric/ubfagent/vars/chaincode/property/node/

# 3. Reset old generated channel/crypto state (keep vars/chaincode) and bootstrap via Minifab
cd fabric/ubfagent
find vars -mindepth 1 -maxdepth 1 ! -name chaincode -exec rm -rf {} +

./minifab netup -e true -s couchdb -i 2.2.3 -o sro.com
./minifab create -c channel1
./minifab join -c channel1
./minifab anchorupdate -c channel1
./minifab profilegen -c channel1
./minifab ccup -n property -l node -v 2.11 -d false -c channel1 -p ''

# Stop Minifab's standalone containers (preserves vars/ and keyfiles/)
./minifab down
cd ../..

# 4. Sync fabric/nbf-samplerest/channel1_connection_for_docker.json with the new TLS certs
python3 - << 'PY'
import json
with open("fabric/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json") as f:
    ccp = json.load(f)
for k, v in ccp.get("orderers", {}).items():
    v["url"] = f"grpcs://{k}:7050"
    v.setdefault("grpcOptions", {})["ssl-target-name-override"] = k
for k, v in ccp.get("peers", {}).items():
    v["url"] = f"grpcs://{k}:7051"
    v.setdefault("grpcOptions", {})["ssl-target-name-override"] = k
for k, v in ccp.get("certificateAuthorities", {}).items():
    v["url"] = f"https://{k}:7054"
    v["caName"] = "ca1"
with open("fabric/nbf-samplerest/channel1_connection_for_docker.json", "w") as f:
    json.dump(ccp, f, indent=2)
PY
```

#### Step 4: Create External Network & Volumes, Then Start Compose
```bash
docker network create nbf-lite_default || true
for v in ca1.sro.com ca1.bank.com ca1.judiciary.com ca1.revenue.com ca1.municipal.com ca1.panchayat.com \
         peer1.sro.com.couchdb peer1.bank.com.couchdb peer1.judiciary.com.couchdb peer1.revenue.com.couchdb peer1.municipal.com.couchdb peer1.panchayat.com.couchdb \
         orderer1.nic.com orderer2.nic.com orderer3.nic.com \
         peer1.sro.com peer1.bank.com peer1.judiciary.com peer1.revenue.com peer1.municipal.com peer1.panchayat.com; do
  docker volume create "$v" >/dev/null
done

# Start the entire 4-stage stack (Fabric -> NBF-Lite Middleware & Academia -> PropChain)
docker compose up -d --build
```
*(To run only PropChain + Hyperledger Fabric without the external `NBF_LITE_DIR` Academia services, run `docker compose up -d --build propchain-frontend`.)*

#### Step 5: Initialize `channel1` & Deploy `property` Chaincode on Compose Peers
Because the Compose peers and orderers start with fresh volumes in Step 4, initialize `channel1` and install/approve/commit `property` inside the `nbf-lite_default` (`nbf-tools`) container:

```bash
docker exec nbf-lite_default bash /vars/run/channelcreate.sh
for org in sro bank judiciary revenue municipal panchayat; do
  docker exec nbf-lite_default bash "/vars/run/channeljoin.peer1.$org.com.sh"
done
for org in sro bank judiciary revenue municipal panchayat; do
  docker exec nbf-lite_default bash "/vars/run/anchorupdate.$org.com.sh"
done

for org in sro bank judiciary revenue municipal panchayat; do
  docker exec nbf-lite_default bash "/vars/run/ccinstall.peer1.$org.com.sh"
done
docker exec nbf-lite_default bash /vars/run/ccapprove.sh
docker exec nbf-lite_default bash /vars/run/cccommit.sh
```
*(If `ccapprove.sh` or `cccommit.sh` hits a signature-policy quoting error on `OR(...)`, see [`scripts/fix_and_commit.sh`](./scripts/fix_and_commit.sh) and [`CHAINCODE_DEPLOYMENT.md`](./CHAINCODE_DEPLOYMENT.md).)*

#### Step 6: Enroll Fabric Identities & Seed Initial Properties
Wait until `curl -s http://localhost:4000/fabric/v1/health` returns `"sFlag":true`, then enroll the CA admins, departmental accounts, demo citizens, and run `initLedger`:

```bash
BASE="http://localhost:4000/fabric/v1"
CFG="/home/mithun/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json"

for org in sro bank judiciary revenue municipal panchayat; do
  curl -s -X POST "$BASE/enrolladmin" -H "Content-Type: application/json" \
    -d "{\"caname\":\"ca1.$org.com\",\"cfgpath\":\"$CFG\",\"mspId\":\"$org-com\"}"
  echo ""
done

for entry in \
  "registrar@sro.com ca1.sro.com sro-com" \
  "manager@bank.com ca1.bank.com bank-com" \
  "court@judiciary.com ca1.judiciary.com judiciary-com" \
  "tahsildar@revenue.com ca1.revenue.com revenue-com" \
  "officer@municipal.com ca1.municipal.com municipal-com" \
  "officer@panchayat.com ca1.panchayat.com panchayat-com" \
  "rahul@cdac.in ca1.sro.com sro-com" \
  "priya@cdac.in ca1.sro.com sro-com" \
  "amit@cdac.in ca1.sro.com sro-com" \
  "sunita@cdac.in ca1.sro.com sro-com"; do
  set -- $entry
  curl -s -X POST "$BASE/registeruser" -H "Content-Type: application/json" \
    -d "{\"user\":\"$1\",\"caname\":\"$2\",\"cfgpath\":\"$CFG\",\"mspId\":\"$3\"}"
  echo ""
done

curl -s -X POST "$BASE/invokecc" -H "Content-Type: application/json" \
  -d "{\"fcn\":\"initLedger\",\"args\":[],\"user\":\"registrar@sro.com\",\"ccname\":\"property\",\"channel\":\"channel1\",\"cfgpath\":\"$CFG\",\"local\":true,\"mspId\":\"sro-com\"}"
```

#### Step 7: Access & Verify
| Service | URL |
| :--- | :--- |
| **PropChain Web App** | `http://localhost:5173` |
| **PropChain Backend Health** | `http://localhost:3001/api/health` |
| **Fabric REST Gateway (`nbf-samplerest`)** | `http://localhost:4000/fabric/v1/health` |
| **NBF Academia Dashboard** *(full stack)* | `http://localhost:80` |

In the PropChain UI, open the **Network** badge in the top navbar and confirm **Live Node** is selected with `http://localhost:4000`, channel `channel1`, chaincode `property`, and MSP `sro-com`.

---

### Option 2: Frontend + Express Backend Only (Dev / Simulated Mode)

Requires Node.js (v18+):

1. Install dependencies and copy [`server/.env.example`](./server/.env.example):
   ```bash
   npm install
   cd server && npm install && cp .env.example .env && cd ..
   ```
2. Start the OTP/Stripe backend and Vite dev server in separate terminals:
   ```bash
   npm run server   # http://localhost:3001
   npm run dev      # http://localhost:5173
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. In the UI **Network** modal, switch on **Simulated Node** if you are not running the Fabric gateway on `:4000`.

---

## 🔐 Authentication & Citizen Login (Aadhar + Nodemailer OTP)

The **Citizen Portal** uses a two-factor Aadhar identity verification workflow:
1. Citizen inputs their **12-digit Aadhar Card Number** (e.g., `8821 4521 4521`).
2. The backend looks up the registered email for that Aadhar and generates a secure 6-digit OTP (valid for 5 minutes).
3. The OTP is delivered to the registered email address via **Nodemailer (SMTP)**.
4. The citizen enters the 6-digit OTP to authenticate and access the land registry.

### Registered Demo Citizens

| Citizen Name | 12-Digit Aadhar Card | Registered Email |
| :--- | :--- | :--- |
| **Rahul Sharma** | `8821 4521 4521` | `rahul@cdac.in` |
| **Priya Patel** | `9920 1123 1123` | `priya@cdac.in` |
| **Amit Kumar** | `4451 8890 8890` | `amit@cdac.in` |
| **Sunita Rao** | `6712 3349 3349` | `sunita@cdac.in` |

*Institutional departments (Judiciary, Banks, SRO, Municipal Authority) continue to use their departmental credentials.*

---

## 📧 Configuring Nodemailer SMTP Email Delivery

Using standard SMTP with your own email account (e.g., Gmail) lets you send emails to **any** recipient without domain verification restrictions:

1. Open `server/.env` (copied from [`server/.env.example`](./server/.env.example)):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SENDER_NAME=PropChain Land Registry
   SENDER_EMAIL=your-email@gmail.com
   PORT=3001
   ```
2. **For Gmail**:
   - Enable 2-Step Verification in your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Generate a 16-character App Password at: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Paste that 16-character password into `SMTP_PASS`.
3. Restart the server with `npm run server`.

> **Note**: If `SMTP_USER` and `SMTP_PASS` are not set yet, the server automatically runs in **Test/Demo Mode**: it generates the OTP and provides it in the UI and server logs with a single-click auto-fill helper so you can test seamlessly right away!

---

## ⛓️ NBF-Lite Blockchain Integration

The blockchain API layer is in [`src/api/blockchain.js`](./src/api/blockchain.js) and the Fabric smart contract is in [`chaincode/property-contract/`](./chaincode/property-contract/README.md) (see also [`CHAINCODE_DEPLOYMENT.md`](./CHAINCODE_DEPLOYMENT.md) and [`LOCATION_FILTERING_PLAN.md`](./LOCATION_FILTERING_PLAN.md)).

### Switch between Simulated Node & Live Node
Click the **Network Status badge** in the navigation bar to open the **NBF-Lite Blockchain Configuration** dialog.
- **Simulated Node**: Local state persistence in browser with simulated smart contract execution.
- **Live Node (Default)**: Connects directly to your running NBF-Lite Hyperledger Fabric REST gateway (`nbf-samplerest`):
  - Base URL: `http://localhost:4000`
  - Channel: `channel1`
  - Chaincode: `property`
  - MSP ID: `sro-com` (with multi-org endorsements across `bank-com`, `judiciary-com`, `municipal-com`, `revenue-com`, `panchayat-com`)

---

## 📁 Project Structure

```
app/
├── docker-compose.yml               # Unified 4-stage Fabric + NBF-Lite + PropChain Compose stack
├── Dockerfile                       # PropChain frontend Nginx production image
├── nginx.conf                       # PropChain frontend SPA routing config
├── .env.example                     # Compose paths template (SERVERS_DIR, NBF_LITE_DIR)
├── CHAINCODE_DEPLOYMENT.md          # Chaincode packaging, upgrade, and lifecycle deployment guide
├── LOCATION_FILTERING_PLAN.md       # Location-based registry schema & filtering architecture
├── Flow Diagram.svg                 # System architecture flow diagram
├── package.json                     # Frontend dependencies & scripts
├── vite.config.js                   # Vite build configuration
├── chaincode/
│   └── property-contract/           # Hyperledger Fabric Node.js smart contract (PropertyContract)
├── docker/
│   ├── nbf-binary/                  # Runner image + loopback forwarding entrypoint for NBF binaries
│   ├── nbf-samplerest/              # Fabric REST gateway Dockerfile (:4000)
│   ├── nbf-ubfagent/                # Minifab / UBF agent Dockerfile (:3000)
│   └── nginx/                       # NBF Academia reverse-proxy Nginx config (:80)
├── fabric/
│   ├── nbf-samplerest/              # Fabric Node SDK REST gateway, CCP resolver, helpers, routes
│   ├── ubfagent/                    # Minifab agent, channel1 artifacts, connection profiles, run scripts
│   └── nbf-academia/                # NBF-Lite installer scripts, templates, JsonData, Ansible & user manuals
├── javascript/
│   └── package.json                 # Fabric SDK reference manifest
├── scripts/                         # Chaincode upgrade, samplerest patch, and API endpoint test scripts
├── server/
│   ├── Dockerfile                   # Express OTP & Stripe backend image (:3001)
│   ├── .env.example                 # SMTP & Stripe configuration template
│   ├── index.js                     # Express OTP, registry & Stripe server
│   └── citizenRegistry.json         # Local citizen Aadhar/property cache
└── src/                             # React + Vite frontend application
```
