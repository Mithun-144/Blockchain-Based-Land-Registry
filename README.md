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

Node.js (v18+) or Docker Compose is recommended.

### Option A: Full Docker Compose Stack (Fabric + NBF-Lite + PropChain)

This repository includes the unified [`docker-compose.yml`](./docker-compose.yml) that boots the entire 4-stage stack in order:
1. **Stage 1:** CouchDB instances (`x6`), Fabric Certificate Authorities (`ca1.*`, `x6`), and MongoDB (`nbf-mongodb`)
2. **Stage 2:** Raft Orderers (`orderer1..3.nic.com`), Endorsing Peers (`peer1.*.com`, `x6`), and `nbf-tools`
3. **Stage 3:** NBF-Lite middleware (`nbf-ubfagent`, `nbf-samplerest` on `:4000`), NBF Academia services & dashboard (`:80`)
4. **Stage 4:** PropChain OTP/Stripe backend (`:3001`) and PropChain web app (`:5173`)

1. Copy the environment templates:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
2. Edit [`.env`](./.env) (`SERVERS_DIR` defaults to `./fabric`; point `NBF_LITE_DIR` to your local NBF-Lite compiled binaries folder if running the NBF Academia portal services) and [`server/.env`](./server/.env) with your SMTP / Stripe keys.
3. Start everything (from WSL / Linux when binding Unix paths & Docker socket):
   ```bash
   docker compose up -d --build
   ```
   > **Note on Fresh Clones:** Fabric private keys (`priv_sk`, `*.key`, `*.pem`, `fabric/ubfagent/vars/keyfiles/`, `fabric/nbf-samplerest/wallet/`) and `>50 MB` compiled NBF Academia binaries/tarballs are excluded from git via [`.gitignore`](./.gitignore). On a fresh machine without pre-existing external Fabric volumes (`ca1.*`, `peer1.*`, `orderer*.nic.com`, `nbf-lite_default`), bootstrap the Fabric network with `fabric/ubfagent/minifab` (`channel1`, 6 orgs) and re-enroll identities via `POST http://localhost:4000/fabric/v1/enrolladmin` and `/fabric/v1/registeruser`.

### Option B: Frontend + Express Server Locally (Dev Mode)

### 1. Start the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173/`.

### 2. Build for Production
```bash
npm run build
```

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

## 🚀 Running the Project

### 1. Start the OTP Authentication Server (Nodemailer)
```bash
npm run server
```
*Runs on `http://localhost:3001`.*

### 2. Start the Frontend
```bash
npm run dev
```
*Runs on `http://localhost:5173`.*

---

## 📧 Configuring Nodemailer SMTP Email Delivery

Using standard SMTP with your own email account (e.g., Gmail) lets you send emails to **any** recipient without domain verification restrictions:

1. Open [`server/.env`](./server/.env):
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
