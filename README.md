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

## 🔐 Default Demo Credentials

- **Citizen Email / Gov e-ID**: `citizen@cdac.in`
- **Password**: `Cdac@123`

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
