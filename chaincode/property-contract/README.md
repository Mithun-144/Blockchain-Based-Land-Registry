# NBF-Lite Property Smart Contract (`PropertyContract`)

The **PropertyContract** is a Hyperledger Fabric smart contract (chaincode) implemented in Node.js using `fabric-contract-api`. It serves as the decentralized ledger engine for the **National Blockchain Framework (NBF-Lite)** property registry, enforcing multi-agency governance, cryptographic title provenance, and role-based access control across a 7-organization network.

- **Contract Class:** `PropertyContract`
- **File:** [`propertyContract.js`](file:///c:/Users/mithu/Downloads/NBF-Lite/chaincode/property-contract/lib/propertyContract.js)
- **Deployed Version:** `2.6` (Sequence `12`) — *With Cryptographic Root-of-Title Audit & Encumbrance Certification*
- **Channel:** `channel1`
- **Endorsement Policy:** `MAJORITY` (Requires signatures from at least 4 of 6 peers)

---

## 🏛️ Participating Organizations & MSP IDs

| Organization | MSP ID | Role & Responsibilities |
| :--- | :--- | :--- |
| **Sub-Registrar Office** | `sro-com` | Deed registration, stamp duty collection (5%), registration fee (1%), title transfer ledger. |
| **State Bank / Financial Inst.** | `bank-com` | Mortgage lien management, home loan hypothecation, NOC issuance. |
| **City Civil Court / Judiciary** | `judiciary-com` | Judicial restraint orders, civil injunctions, court freeze & stay vacation. |
| **Municipal Corporation** | `municipal-com` | Urban cadastral verification, BBMP e-Khata issuance, urban guideline valuation. |
| **Taluk Revenue Office** | `revenue-com` | Rural/agricultural cadastral verification, RTC Bhoomi Pahani, Tahsildar valuation. |
| **Gram Panchayat** | `panchayat-com` | Village local body verification, Form 9 & Form 11 rural property records. |
| **NIC Ordering Service** | `nic.com` | Raft consensus orderer cluster (`orderer1..3.nic.com`). |

---

## 📋 Comprehensive Smart Contract Function Reference

### 1. Initialization & Ledger Checks

#### `initLedger(ctx)`
- **Type:** Transaction (Invoke)
- **Access Control:** Any authorized network admin / SRO member
- **Description:** Initializes the blockchain World State with 4 baseline reference properties (`PROP001` through `PROP004`), spanning urban municipal, rural revenue, agricultural, and panchayat jurisdictions.
- **Parameters:** None (`ctx` passed implicitly)
- **Returns:** JSON string with status `SUCCESS` and initial count.

#### `recordExists(ctx, id)`
- **Type:** Query (Read-only)
- **Access Control:** Public on channel
- **Description:** Checks whether a property record with the specified ID exists in World State.
- **Parameters:**
  - `id` *(string)*: Unique property identifier (e.g. `PROP001`).
- **Returns:** `boolean` (`true` if exists, `false` otherwise).

---

### 2. Core Property Transactions

#### `addProperty(ctx, ...args)`
- **Type:** Transaction (Invoke)
- **Access Control:** Registered Citizen / Landowner / Authority
- **Description:** Creates and records a new property title into the distributed ledger. Supports both JSON object payload or positional arguments. Computes initial stamp duty (5%) and registration fee (1%), assigns jurisdiction, and sets default unencumbered/unfrozen status.
- **Parameters (Positional):**
  - `id` *(string)*: Unique property identifier (e.g. `PROP005`).
  - `title` *(string)*: Property title / name (e.g. `Palm Grove Villa`).
  - `address` *(string)*: Complete postal address.
  - `area` *(string)*: Built-up or land area (e.g. `2400 sq.ft`, `2 Acres`).
  - `type` *(string)*: Property category (`Residential`, `Commercial`, `Plot`, `Agricultural`).
  - `rawValue` *(number/string)*: Declared monetary valuation in INR.
  - `owner` *(string)*: Email address of registered owner.
  - `jurisdiction` *(string)*: `municipal`, `revenue`, or `panchayat`.
  - `surveyNumber` *(string, optional)*: Cadastral survey/plot number.
  - `eKhataNo` *(string, optional)*: e-Khata or RTC record identifier.
- **Returns:** JSON representation of the newly created `PropertyRecord`.

#### `createRecord(ctx, ...args)`
- **Type:** Transaction (Invoke)
- **Description:** Backward-compatible alias for `addProperty`.

#### `retrieveProperty(ctx, id)`
- **Type:** Query (Read-only)
- **Access Control:** Public on channel
- **Description:** Retrieves the complete property state from CouchDB World State by key. Guarantees schema defaults for backward compatibility (`freezeLog`, `encumbranceLog`, `guidelineValue`, etc.).
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
- **Returns:** JSON representation of the `PropertyRecord`. Throws an error if record not found.

#### `queryRecord(ctx, ...args)`
- **Type:** Query (Read-only)
- **Description:** Backward-compatible alias for `retrieveProperty`.

#### `listPropertyForSale(ctx, id, askingPrice, sellerEmail)`
- **Type:** Transaction (Invoke)
- **Access Control:** Registered property owner
- **Description:** Lists an owned property on the public marketplace.
- **Pre-execution Verification Checks:**
  1. **Court Freeze Guard:** Rejects transaction if `record.frozen === true` (under judicial injunction).
  2. **Ownership Guard:** Validates that `sellerEmail` matches `record.owner`.
  3. **Cadastral Guard:** Verifies `record.ownershipVerified !== false` (must be verified by relevant local authority).
  4. **Encumbrance Guard:** Verifies `record.encumbrance === false` (no active bank mortgages or liens).
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `askingPrice` *(number/string)*: Listing price in INR.
  - `sellerEmail` *(string)*: Email of the current registered owner.
- **Returns:** Updated `PropertyRecord` with `listedForSale: true` and `status: 'for_sale'`.

#### `buyProperty(ctx, id, buyerEmail, paymentRef)`
- **Type:** Transaction (Invoke)
- **Access Control:** Citizen Buyer
- **Description:** Executes deed transfer, title mutation, and ownership change from seller to buyer on the immutable ledger.
- **Pre-execution Verification Checks:**
  1. **Court Injunction Guard:** Blocks transfer if property has an active court freeze order.
  2. **Market Listing Guard:** Property must be listed (`listedForSale: true`).
  3. **Self-Purchase Guard:** Buyer cannot already be the current registered owner.
  4. **Authority Guard:** Cadastral verification must be valid.
  5. **SRO Encumbrance Guard:** Property must be clear of bank liens and charges.
  6. **Treasury / Challan Guard:** Requires a non-empty `paymentRef` (K2 Challan / Bank Reference).
- **Side Effects:**
  - Appends audit block to `transferHistory` containing `txId`, `from`, `to`, `amount`, `stampDuty`, `registrationFee`, and `paymentRef`.
  - Mutates `owner` to `buyerEmail`, resets `listedForSale` to `false`, and updates `lastTransferDate`.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `buyerEmail` *(string)*: Email address of the purchasing citizen.
  - `paymentRef` *(string)*: Treasury challan or bank payment transaction reference.
- **Returns:** Updated `PropertyRecord`.

#### `transferOwnership(ctx, ...args)`
- **Type:** Transaction (Invoke)
- **Description:** Backward-compatible alias for `buyProperty` with direct challan settlement.

#### `delistProperty(ctx, id, sellerEmail)`
- **Type:** Transaction (Invoke)
- **Access Control:** Current registered owner
- **Description:** Withdraws a property listing from the public marketplace.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `sellerEmail` *(string)*: Email address of the property owner.
- **Returns:** Updated `PropertyRecord` with `listedForSale: false`.

---

### 3. Multi-Org Governance & Statutory Control

#### `setEncumbranceStatus(ctx, id, status, remarks, encumbranceType)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** `bank-com`, `judiciary-com`
- **Description:** Attaches or discharges a mortgage lien, hypothecation, or legal financial encumbrance on a title.
- **Audit Logging:** Automatically appends an entry to `encumbranceLog` recording `action` (`FLAGGED` or `CLEARED`), `type`, `remarks`, `mspId`, `txId`, and timestamp.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `status` *(boolean/string)*: `true` to flag encumbrance / `false` to clear lien.
  - `remarks` *(string)*: Loan account number, sanction reference, or NOC details.
  - `encumbranceType` *(string, optional)*: `BANK_MORTGAGE`, `COLLATERAL_CHARGE`, `TAX_LIEN`. Defaults to caller MSP type.
- **Returns:** Updated `PropertyRecord`.

#### `freezeProperty(ctx, id, caseNo, remarks)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** `judiciary-com`
- **Description:** Issues a judicial restraint order / court injunction against a property. Sets `frozen: true`, attaches `caseNo`, flags `encumbrance: true`, and blocks all subsequent sales, transfers, or listings across the network.
- **Audit Logging:** Appends an immutable record to both `freezeLog` and `encumbranceLog`.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `caseNo` *(string)*: Official court suit/case number (e.g. `OS-4482/2024`).
  - `remarks` *(string)*: Court injunction order summary or restraint grounds.
- **Returns:** Updated `PropertyRecord`.

#### `unfreezeProperty(ctx, id, orderRef, remarks)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** `judiciary-com`
- **Description:** Formally vacates a court injunction / stay order upon disposal of litigation. Restores property state to `frozen: false` and clears judicial encumbrance.
- **Audit Logging:** Appends a vacation entry to both `freezeLog` and `encumbranceLog` with `orderRef` and judicial signer MSP.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `orderRef` *(string)*: Court vacation order reference (e.g. `VAC-ORDER-2024-99`).
  - `remarks` *(string)*: Final decree or dismissal remarks.
- **Returns:** Updated `PropertyRecord`.

#### `verifyAuthorityDetails(ctx, id, eKhataNo, surveyNumber)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** `revenue-com`, `municipal-com`, `panchayat-com`
- **Jurisdiction Enforcement:**
  - Property under `municipal` jurisdiction can **only** be verified by `municipal-com`.
  - Property under `revenue` jurisdiction can **only** be verified by `revenue-com`.
  - Property under `panchayat` jurisdiction can **only** be verified by `panchayat-com`.
- **Description:** Verifies ground cadastral survey authenticity and assigns certified e-Khata and Survey numbers. Sets `ownershipVerified: true` and records `verifiedBy`, `verificationDate`, and `verificationTxId`.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `eKhataNo` *(string)*: Certified e-Khata or RTC Bhoomi number.
  - `surveyNumber` *(string)*: Certified cadastral survey/plot number.
- **Returns:** Updated `PropertyRecord`.

#### `revokeOwnershipVerification(ctx, id, reason)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** Relevant cadastral authority matching jurisdiction
- **Description:** Revokes ownership verification in the event of boundary disputes, fraud claims, or survey re-inspections. Sets `ownershipVerified: false` and automatically removes the property from marketplace sale listings.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `reason` *(string)*: Official ground for revocation (e.g. `Boundary encroachment dispute`).
- **Returns:** Updated `PropertyRecord`.

#### `updateValuation(ctx, id, newGuidelineValue, valuationRef)`
- **Type:** Transaction (Invoke)
- **Access Control:** 🔒 **Restricted to:** `revenue-com`, `municipal-com`, `panchayat-com`, `sro-com`
- **Description:** Updates the official government guideline rate (circle rate). Automatically recalibrates the property's stamp duty and registration fees using `max(marketPrice, guidelineValue)`.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
  - `newGuidelineValue` *(number/string)*: Revised guideline rate in INR.
  - `valuationRef` *(string)*: Official gazette notification or revision order number.
- **Returns:** Updated `PropertyRecord`.

#### `calculateStampDuty(ctx, propertyValue)`
- **Type:** Query (Read-only)
- **Access Control:** Public on channel (SRO logic)
- **Description:** Computes exact statutory stamp duty (5%) and registration fee (1%) for any given property valuation.
- **Parameters:**
  - `propertyValue` *(number/string)*: Property assessment value in INR.
- **Returns:**
  ```json
  {
    "stampDuty": 425000,
    "stampDutyFormatted": "₹4,25,000",
    "registrationFee": 85000,
    "registrationFeeFormatted": "₹85,000",
    "totalDuties": 510000,
    "totalDutiesFormatted": "₹5,10,000"
  }
  ```

---

### 4. Query & Ledger Audit Reports

#### `queryAllRecords(ctx)`
- **Type:** Query (Read-only)
- **Description:** Performs a range scan (`getStateByRange`) of all property documents committed to CouchDB World State with `docType === 'PropertyRecord'`.
- **Parameters:** None.
- **Returns:** Array of all `PropertyRecord` objects.

#### `queryRecordsByOwner(ctx, ownerEmail)`
- **Type:** Query (Read-only)
- **Description:** Queries and returns all properties currently owned by a specified email address.
- **Parameters:**
  - `ownerEmail` *(string)*: Registered owner email.
- **Returns:** Array of matching `PropertyRecord` objects.

#### `queryListings(ctx)`
- **Type:** Query (Read-only)
- **Description:** Queries all properties actively listed for sale on the marketplace. Augments each record with a `listingWarning` flag (`COURT_FROZEN`, `ENCUMBERED`, `UNVERIFIED`, or `NONE`) to assist frontend UIs in rendering alerts.
- **Parameters:** None.
- **Returns:** Array of marketplace `PropertyRecord` objects.

#### `queryEncumberedProperties(ctx)`
- **Type:** Query (Read-only)
- **Description:** Returns all properties on the channel currently encumbered with bank mortgage liens or charges (`encumbrance === true`). Used by Bank and SRO dashboards.
- **Parameters:** None.
- **Returns:** Array of encumbered `PropertyRecord` objects.

#### `queryFrozenProperties(ctx)`
- **Type:** Query (Read-only)
- **Description:** Returns all properties currently under active judicial freeze / court injunction orders (`frozen === true`). Used by Court and SRO dashboards.
- **Parameters:** None.
- **Returns:** Array of restrained `PropertyRecord` objects.

#### `queryByJurisdiction(ctx, jurisdictionType)`
- **Type:** Query (Read-only)
- **Description:** Filters and returns properties belonging to a specific administrative authority jurisdiction.
- **Parameters:**
  - `jurisdictionType` *(string)*: `municipal`, `revenue`, or `panchayat`.
- **Returns:** Array of matching `PropertyRecord` objects.

#### `queryPendingVerification(ctx)`
- **Type:** Query (Read-only)
- **Description:** Returns all properties currently awaiting cadastral authority verification (`ownershipVerified === false`). Used by Municipal, Tahsildar, and Panchayat officer portals.
- **Parameters:** None.
- **Returns:** Array of pending `PropertyRecord` objects.

#### `getPropertyHistory(ctx, id)`
- **Type:** Query (Read-only)
- **Description:** Reads the complete cryptographic provenance and mutation history for a given property key directly from Fabric's block history index (`ctx.stub.getHistoryForKey(id)`).
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
- **Returns:** Array of transaction history entries, each containing:
  - `txId` *(string)*: Hyperledger Fabric transaction hash.
  - `timestamp` *(object)*: Block commit timestamp.
  - `isDelete` *(boolean)*: Tombstone indicator.
  - `value` *(object)*: Historic state snapshot at that block.

#### `generateEncumbranceCertificate(ctx, id)`
- **Type:** Query (Read-only)
- **Access Control:** Public on channel (Citizens, Banks, Courts, SRO)
- **Description:** Performs an authoritative **Root-of-Title & Historical Encumbrance Audit**. Instead of relying solely on a point-in-time state flag, it reconciles all past mortgages/liens (`FLAGGED` vs `CLEARED`) and court restraint orders (`FROZEN` vs `UNFROZEN`) to certify title marketability under Section 57 of the Registration Act.
- **Parameters:**
  - `id` *(string)*: Unique property identifier (e.g. `PROP001`).
- **Returns:**
  - **`FORM_16_NIL_ENCUMBRANCE`** (Certificate of Nil Encumbrance): Issued when all historic financial charges have corresponding bank release NOCs, all court orders are vacated, and authority verification is active.
  - **`FORM_15_ENCUMBERED`** (Statement of Encumbrances): Issued when active or un-discharged mortgages, un-vacated judicial restraints, or revoked cadastral records affect the property.

#### `verifyRootTitle(ctx, id)`
- **Type:** Query (Read-only)
- **Description:** Lightweight root-of-title health check returning clean title boolean status, form type (`FORM_15` vs `FORM_16`), active liens count, and active court orders count.
- **Parameters:**
  - `id` *(string)*: Unique property identifier.
- **Returns:** JSON object summarizing title clean status.

---

## 🔒 Security & Access Control Summary

| Smart Contract Function | Allowed Caller MSP(s) | Pre-condition Checks |
| :--- | :--- | :--- |
| `freezeProperty` | `judiciary-com` | Valid Case Number required |
| `unfreezeProperty` | `judiciary-com` | Valid Vacation Order Ref required |
| `setEncumbranceStatus` | `bank-com`, `judiciary-com` | Valid Status and remarks |
| `verifyAuthorityDetails` | `revenue-com`, `municipal-com`, `panchayat-com` | Caller MSP must strictly match property jurisdiction |
| `revokeOwnershipVerification` | `revenue-com`, `municipal-com`, `panchayat-com` | Caller MSP must match property jurisdiction |
| `updateValuation` | `revenue-com`, `municipal-com`, `panchayat-com`, `sro-com` | Valid numerical guideline valuation |
| `listPropertyForSale` | Current Registered Owner | Must be unfrozen, unencumbered, & verified |
| `buyProperty` | Citizen Buyer | Unfrozen, unencumbered, verified, listed, valid challan |
| `delistProperty` | Current Registered Owner | Caller must own the property |
| Queries (`query*`) | Channel Members | Read-only state evaluation |

---

## 🛠️ Testing via REST API (`nbf-samplerest`)

All functions can be called via the NBF-Lite REST gateway at `http://192.168.231.128:4000/fabric/v1/invokecc`:

```bash
# Example 1: Freeze property PROP001 as Civil Court Registrar
curl -X POST http://192.168.231.128:4000/fabric/v1/invokecc \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "freezeProperty",
    "args": ["PROP001", "OS-4482/2024", "Civil Court Restraint Order"],
    "user": "court@judiciary.com",
    "ccname": "property",
    "channel": "channel1",
    "cfgpath": "/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json",
    "local": true,
    "mspId": "judiciary-com"
  }'

# Example 2: Flag bank mortgage lien as SBI Bank Manager
curl -X POST http://192.168.231.128:4000/fabric/v1/invokecc \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "setEncumbranceStatus",
    "args": ["PROP001", "true", "SBI Home Loan A/C 991823741", "BANK_MORTGAGE"],
    "user": "manager@bank.com",
    "ccname": "property",
    "channel": "channel1",
    "cfgpath": "/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json",
    "local": true,
    "mspId": "bank-com"
  }'

# Example 3: Query full provenance history
curl -X POST http://192.168.231.128:4000/fabric/v1/invokecc \
  -H "Content-Type: application/json" \
  -d '{
    "fcn": "getPropertyHistory",
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

## 🔍 Live Chaincode Inspection & Container Diagnostics

To inspect the exact code currently running in the active chaincode Docker container on the VM peer nodes:

```bash
# View active smart contract file inside live SRO peer chaincode container
docker exec $(docker ps -q --filter "name=dev-peer1.sro.com-property" | head -n 1) cat /usr/local/src/lib/propertyContract.js
```

To view all active chaincode containers:
```bash
docker ps --filter "name=dev-peer1"
```

---

## 👤 REST API — User Wallet & Registration

The REST server (`nbf-samplerest`) manages user identities in a **file system wallet** at:
```
~/.servers/nbf-samplerest/wallet/<mspId>/
```

### Confirmed Enrolled Users (as of 2026-10-29)

| Org (MSP) | Enrolled Users |
|:---|:---|
| `sro-com` | `admin`, `registrar@sro.com`, `buyer@citizen.com`, `rahul@cdac.in`, `priya@cdac.in`, `amit@cdac.in`, `sunita@cdac.in` |
| `bank-com` | `admin`, `manager@bank.com` |
| `judiciary-com` | `admin`, `court@judiciary.com` |
| `revenue-com` | `admin`, `tahsildar@revenue.com` |
| `municipal-com` | `admin`, `officer@municipal.com` |
| `panchayat-com` | `admin`, `officer@panchayat.com` |

### Check Enrolled Users
```bash
for org in ~/.servers/nbf-samplerest/wallet/*/; do
  echo "--- $(basename $org) ---"
  ls "$org"
done
```

### Register a New User
```bash
# CA names use ca1. prefix (NOT ca.): ca1.sro.com, ca1.bank.com, etc.
curl -s -X POST http://192.168.231.128:4000/fabric/v1/registeruser \
  -H "Content-Type: application/json" \
  -d '{
    "user": "registrar@sro.com",
    "caname": "ca1.sro.com",
    "cfgpath": "/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json",
    "mspId": "sro-com"
  }'
```

> ⚠️ **CA Naming Gotcha:** The connection profile uses `ca1.<org>.com` (with `1`), **not** `ca.<org>.com`. Using the wrong name returns `Error: CA ca.sro.com not found`.

### Enroll Admin (one-time per org)
```bash
curl -s -X POST http://192.168.231.128:4000/fabric/v1/enrolladmin \
  -H "Content-Type: application/json" \
  -d '{
    "caname": "ca1.sro.com",
    "cfgpath": "/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json",
    "mspId": "sro-com"
  }'
```

---

## 🧪 Full API Test Suite

A comprehensive test script is included at [`test_all_endpoints.sh`](file:///c:/Users/mithu/Downloads/NBF-Lite/test_all_endpoints.sh) that covers all 22 test cases across all contract functions.

### Run on VM
```bash
# Copy from Windows (run from app/ directory)
scp ../test_all_endpoints.sh admin1@192.168.231.128:~/

# Execute on VM
bash ~/test_all_endpoints.sh 2>&1 | tee ~/test_results.log
```

### Confirmed Test Results (v2.5, 2026-10-29)

| # | Function | Caller MSP | Result |
|---|---|---|---|
| 1 | `initLedger` | `sro-com` | ✅ PASSED |
| 2 | `addProperty` PROP099 | `sro-com` | ✅ PASSED |
| 3 | `retrieveProperty` PROP001 | `sro-com` | ✅ PASSED |
| 4 | `retrieveProperty` PROP099 | `sro-com` | ✅ PASSED |
| 5 | `verifyAuthorityDetails` PROP099 | `municipal-com` | ✅ PASSED |
| 6 | `setEncumbranceStatus` FLAG PROP001 | `bank-com` | ✅ PASSED |
| 7 | `setEncumbranceStatus` CLEAR PROP001 | `bank-com` | ✅ PASSED |
| 8 | `freezeProperty` PROP002 | `judiciary-com` | ✅ PASSED |
| 9 | `unfreezeProperty` PROP002 | `judiciary-com` | ✅ PASSED |
| 10 | `generateEncumbranceCertificate` PROP001 | `sro-com` | ✅ PASSED — Form 16 Nil EC |
| 11 | `generateEncumbranceCertificate` PROP099 | `sro-com` | ✅ PASSED — Form 16 Nil EC |
| 12 | `verifyRootTitle` PROP001 | `sro-com` | ✅ PASSED — `CLEAN_MARKETABLE_TITLE` |
| 13 | `listPropertyForSale` PROP099 | `sro-com` | ✅ PASSED |
| 14 | `buyProperty` PROP099 | `sro-com` | ✅ PASSED |
| 15 | `queryAllRecords` | `sro-com` | ✅ PASSED — 19 records returned |
| 16 | `queryListings` | `sro-com` | ✅ PASSED |
| 17 | `queryEncumberedProperties` | `bank-com` | ✅ PASSED |
| 18 | `queryFrozenProperties` | `judiciary-com` | ✅ PASSED |
| 19 | `queryByJurisdiction` municipal | `municipal-com` | ✅ PASSED |
| 20 | `queryPendingVerification` | `sro-com` | ✅ PASSED |
| 21 | `getPropertyHistory` PROP001 | `sro-com` | ✅ PASSED — 9 txns in audit trail |
| 22 | `updateValuation` PROP001 | `sro-com` | ✅ PASSED |

> **Note:** `listPropertyForSale` requires the caller to be the **registered owner** of the property. The chaincode correctly rejects the call with `Ownership Check Failed` if the caller's identity doesn't match the `owner` field.

---

## 🚀 Chaincode Deployment & Minifabric Lifecycle Guide

### 1. Upgrade Command
To upgrade the chaincode on all 6 peer nodes:
```bash
cd ~/.servers/ubfagent
./minifab ccup -n property -l node -v 2.6 -s 12 -p ''
```

> ⚠️ **Version & Sequence Rules:**
> - If you receive `500 - chaincode already successfully installed`, bump the version string (e.g., `2.5` → `2.6`).
> - The sequence number `-s` must be strictly increasing with each committed definition.

### 2. Known Minifabric Quoting Bug (`syntax error near unexpected token ')'`)
Minifabric generates invalid shell escaping for `--signature-policy` in `vars/run/ccapprove.sh` and may hardcode an older version in `vars/run/cccommit.sh`. If `minifab ccup` halts during `cc approve`, apply the standard fix:

```bash
cd ~/.servers/ubfagent

# 1. Fix broken signature policy quoting in ccapprove.sh
sed -i "s|--signature-policy .*|--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" \\\\|g" vars/run/ccapprove.sh

# 2. Fix target version in cccommit.sh (ensure it matches the new version, e.g. 2.6)
sed -i 's/--version 2.[0-9]/--version 2.6/g' vars/run/cccommit.sh

# 3. Add signature-policy to cccommit.sh if missing
if ! grep -q "signature-policy" vars/run/cccommit.sh; then
  sed -i "s/--cafile \$ORDERER_TLS_CA --tls/--signature-policy \"OR('sro-com.member','bank-com.member','judiciary-com.member','revenue-com.member','municipal-com.member','panchayat-com.member')\" --cafile \$ORDERER_TLS_CA --tls/" vars/run/cccommit.sh
fi
```

### 3. Run Manual Approve & Commit Containers
```bash
# Approve definition for all 6 organizations:
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/ccapprove.sh

# Commit definition to channel1:
docker run --rm \
  -v ~/.servers/ubfagent/vars:/vars \
  --network nbf-lite_default \
  hyperledger/fabric-tools:2.2.3 \
  bash /vars/run/cccommit.sh

# Verify live chaincode containers:
docker ps --filter "name=property_2.6"
```

