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

Node.js (v24+) is installed on this device.

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

## 🔐 Authentication & Citizen Login (Aadhar + Brevo OTP)

The **Citizen Portal** uses a two-factor Aadhar identity verification workflow:
1. Citizen inputs their **12-digit Aadhar Card Number** (e.g., `8821 4521 4521`).
2. The backend looks up the registered email for that Aadhar and generates a secure 6-digit OTP (valid for 5 minutes).
3. The OTP is delivered to the registered email address via **Brevo (formerly Sendinblue)**.
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

### 1. Start the OTP Authentication Server (Brevo)
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

## 📧 Configuring Brevo Email Delivery (Free Tier)

Brevo provides 300 free emails per day without requiring a credit card:

1. Create a free account at [https://www.brevo.com](https://www.brevo.com).
2. Go to **Settings** → **Senders, Domains & Dedicated IPs** → **Senders** and verify your sender email.
3. Go to **SMTP & API** → **API Keys** and generate a new API key.
4. Open [`server/.env`](./server/.env) and update:
   ```env
   BREVO_API_KEY=xkeysib-your-brevo-api-key-here
   SENDER_EMAIL=your-verified-email@domain.com
   SENDER_NAME=PropChain Land Registry
   PORT=3001
   ```
5. Restart the server with `npm run server`.

> **Note**: If `BREVO_API_KEY` is not set yet, the server automatically runs in **Test/Demo Mode**: it generates the OTP and provides it in the UI and server logs with a single-click auto-fill helper so you can test seamlessly right away!

---

## ⛓️ NBF-Lite Blockchain Integration

The blockchain API layer is in [`src/api/blockchain.js`](./src/api/blockchain.js).

### Switch between Simulated Node & Live Node
Click the **Network Status badge** in the navigation bar to open the **NBF-Lite Blockchain Configuration** dialog.
- **Simulated Node (Default)**: Full local state persistence in browser with instant simulated smart contract execution.
- **Live Node**: Connects directly to your running NBF-Lite Hyperledger Fabric peer via REST endpoints:
  - Base URL: `http://localhost:3000` (or your VM IP)
  - Channel: `localchannelone`
  - Chaincode: `property`
  - MSP ID: `cdacMSP`

---

## 📁 Project Structure

```
app/
├── Flow Diagram.svg             # Original system flow diagram
├── index.html                   # HTML entry point for Vite
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite build configuration
├── dist/                        # Optimized production build bundle
└── src/
    ├── main.jsx                 # React root renderer
    ├── App.jsx                  # Main app routing & state
    ├── index.css                # Design system & dark glassmorphism styling
    ├── api/
    │   └── blockchain.js        # NBF-Lite Fabric REST & mock API layer
    ├── components/
    │   ├── Navbar.jsx           # Top navigation with network status & user menu
    │   ├── PropertyCard.jsx     # Reusable property card with quick actions
    │   ├── RegisterModal.jsx    # Modal for on-chain property registration
    │   └── NetworkModal.jsx     # Modal to configure NBF-Lite REST endpoints
    └── pages/
        ├── LoginPage.jsx        # Gov e-ID citizen authentication
        ├── Dashboard.jsx        # Portfolio stats, owned properties & market highlights
        ├── MyProperties.jsx     # Citizen title deed management
        ├── Marketplace.jsx      # Property marketplace with search and category filters
        ├── PropertyDetail.jsx   # Detailed title deed, legal check, & history timeline
        └── TransferWizard.jsx   # 7-step ownership transfer execution wizard
```
