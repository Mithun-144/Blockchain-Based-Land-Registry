'use strict';

const { Contract } = require('fabric-contract-api');

class PropertyContract extends Contract {
    constructor() {
        super('PropertyContract');
    }

    // ==========================================
    // INTERNAL HELPERS & MSP GUARDS
    // ==========================================

    /**
     * Get caller MSP ID safely from client identity
     */
    _getMspId(ctx) {
        try {
            if (ctx.clientIdentity && typeof ctx.clientIdentity.getMSPID === 'function') {
                return ctx.clientIdentity.getMSPID();
            }
        } catch (e) {
            console.warn('Unable to get MSP ID from clientIdentity:', e.message);
        }
        return 'UNKNOWN_MSP';
    }

    /**
     * Deterministic key-sorted JSON serialization so CouchDB and peer state cache
     * produce identical read/write sets across all endorsing peers.
     */
    _sortKeys(val) {
        if (Array.isArray(val)) {
            return val.map(v => this._sortKeys(v));
        }
        if (val && typeof val === 'object') {
            const sorted = {};
            for (const k of Object.keys(val).sort()) {
                if (val[k] !== undefined) {
                    sorted[k] = this._sortKeys(val[k]);
                }
            }
            return sorted;
        }
        return val;
    }

    _canonicalStringify(obj) {
        return JSON.stringify(this._sortKeys(obj));
    }

    /**
     * Deterministic transaction timestamp derived from proposal header
     * so all endorsing peers compute the exact same date/timestamp.
     */
    _getTxTimestampMs(ctx) {
        try {
            const ts = ctx.stub.getTxTimestamp();
            if (ts) {
                if (typeof ts.getTime === 'function') {
                    return ts.getTime();
                }
                let seconds = 0;
                if (typeof ts.seconds === 'number') {
                    seconds = ts.seconds;
                } else if (ts.seconds && typeof ts.seconds.toNumber === 'function') {
                    seconds = ts.seconds.toNumber();
                } else if (ts.seconds && ts.seconds.low !== undefined) {
                    seconds = ts.seconds.low;
                }
                const nanos = ts.nanos || 0;
                if (seconds > 0) {
                    return seconds * 1000 + Math.floor(nanos / 1000000);
                }
            }
        } catch (e) {}
        return Date.now();
    }

    _getTxIso(ctx) {
        return new Date(this._getTxTimestampMs(ctx)).toISOString();
    }

    _getTxDate(ctx) {
        return this._getTxIso(ctx).split('T')[0];
    }

    /**
     * Assert caller MSP matches allowed orgs
     */
    _assertMsp(ctx, allowedMsps, fnName) {
        const callerMsp = this._getMspId(ctx);
        if (!allowedMsps.includes(callerMsp)) {
            throw new Error(
                `Access Denied: ${fnName} can only be called by [${allowedMsps.join(', ')}]. Caller MSP: ${callerMsp}`
            );
        }
    }

    /**
     * Parse arguments whether passed as individual arguments or a single JSON array string
     */
    _parseArgs(argsArray) {
        if (argsArray.length > 0 && typeof argsArray[0] === 'string' && argsArray[0].trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(argsArray[0]);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {}
        }
        return argsArray;
    }

    /**
     * Ensure standardized structured schema & safe defaults on records
     */
    _ensureDefaults(record) {
        if (!record.encumbranceLog) record.encumbranceLog = [];
        if (!record.freezeLog) record.freezeLog = [];
        if (record.frozen === undefined) record.frozen = false;
        if (!record.freezeCaseNo) record.freezeCaseNo = '';
        if (!record.freezeRemarks) record.freezeRemarks = '';
        if (!record.encumbranceType) {
            record.encumbranceType = record.encumbrance ? 'BANK_MORTGAGE' : 'NONE';
        }
        if (record.guidelineValue === undefined) {
            record.guidelineValue = record.rawValue || 0;
        }
        if (!record.verifiedBy) record.verifiedBy = '';
        if (!record.verificationDate) record.verificationDate = '';
        if (!record.verificationTxId) record.verificationTxId = '';
        if (!record.lastValuationRef) record.lastValuationRef = '';
        if (!record.lastValuationDate) record.lastValuationDate = '';
        if (!record.transferHistory) record.transferHistory = [];

        // Structured Spatial / Location fields
        if (!record.state) record.state = 'Karnataka';
        if (!record.district) record.district = 'Bangalore Urban';
        if (!record.taluk) record.taluk = 'Bangalore North';
        if (!record.city) record.city = 'Bangalore';
        if (!record.locality) record.locality = 'Central';
        if (!record.pincode) record.pincode = '560001';

        // Auto-compose address if missing or empty
        if (!record.address) {
            record.address = `${record.locality}, ${record.taluk}, ${record.district}, ${record.state} - ${record.pincode}`;
        }

        return record;
    }

    /**
     * Helper to format numbers into INR representation (e.g. 8500000 -> ₹85,00,000)
     */
    _formatINR(val) {
        const num = Number(val) || 0;
        return '₹' + num.toLocaleString('en-IN');
    }

    /**
     * Calculates Stamp Duty (5%) and Registration Fee (1%)
     * SRO responsibility
     */
    _calculateDuties(val) {
        const num = Number(val) || 0;
        const stampDuty = Math.round(num * 0.05); // 5% Stamp Duty
        const regFee = Math.round(num * 0.01);    // 1% Registration Fee
        return {
            stampDuty,
            stampDutyFormatted: this._formatINR(stampDuty),
            registrationFee: regFee,
            registrationFeeFormatted: this._formatINR(regFee),
            totalDuties: stampDuty + regFee,
            totalDutiesFormatted: this._formatINR(stampDuty + regFee)
        };
    }

    /**
     * Deep Root-of-Title & Historical Encumbrance Audit
     * Reconciles all historical FLAGGED liens against authoritative CLEARED discharges,
     * and all FROZEN court injunctions against UNFROZEN vacation orders.
     */
    async _buildEncumbranceCertificate(ctx, record) {
        this._ensureDefaults(record);
        const id = record.id;

        // 1. Gather audit logs
        const encLog = Array.isArray(record.encumbranceLog) ? record.encumbranceLog : [];
        const freezeLog = Array.isArray(record.freezeLog) ? record.freezeLog : [];

        // 2. Reconcile Bank Mortgages & Liens
        const lienStack = [];
        for (const entry of encLog) {
            if (entry.action === 'FLAGGED') {
                lienStack.push(entry);
            } else if (entry.action === 'CLEARED') {
                const matchIdx = lienStack.findIndex(l =>
                    (entry.type && l.type === entry.type) ||
                    (entry.remarks && l.remarks && entry.remarks.includes(l.remarks))
                );
                if (matchIdx !== -1) {
                    lienStack.splice(matchIdx, 1);
                } else if (lienStack.length > 0) {
                    lienStack.pop();
                }
            }
        }

        const unresolvedLiens = [];
        for (const unreleased of lienStack) {
            unresolvedLiens.push({
                type: unreleased.type || 'BANK_MORTGAGE',
                remarks: unreleased.remarks || 'Active financial mortgage charge',
                flaggedBy: unreleased.mspId || 'bank-com',
                txId: unreleased.txId || '',
                date: unreleased.date || ''
            });
        }

        // Cross-verify with current boolean flag
        if (record.encumbrance === true && unresolvedLiens.length === 0) {
            unresolvedLiens.push({
                type: record.encumbranceType || 'ACTIVE_MORTGAGE',
                remarks: record.encumbranceRemarks || 'Lien active on current World State',
                flaggedBy: 'bank-com',
                txId: record.lastTxId || '',
                date: record.regDate || ''
            });
        }

        // 3. Reconcile Judicial Restraint & Freeze Orders
        const freezeStack = [];
        for (const entry of freezeLog) {
            if (entry.action === 'FROZEN') {
                freezeStack.push(entry);
            } else if (entry.action === 'UNFROZEN') {
                const matchIdx = freezeStack.findIndex(f =>
                    (entry.caseNo && f.caseNo === entry.caseNo) ||
                    (entry.orderRef && f.remarks && f.remarks.includes(entry.orderRef))
                );
                if (matchIdx !== -1) {
                    freezeStack.splice(matchIdx, 1);
                } else if (freezeStack.length > 0) {
                    freezeStack.pop();
                }
            }
        }

        const unresolvedCourtStays = [];
        for (const unvacated of freezeStack) {
            unresolvedCourtStays.push({
                caseNo: unvacated.caseNo || 'JUDICIAL_INJUNCTION',
                remarks: unvacated.remarks || 'Restraint order in effect',
                issuedBy: unvacated.mspId || 'judiciary-com',
                txId: unvacated.txId || '',
                date: unvacated.date || ''
            });
        }

        if (record.frozen === true && unresolvedCourtStays.length === 0) {
            unresolvedCourtStays.push({
                caseNo: record.freezeCaseNo || 'CIVIL_ORDER',
                remarks: record.freezeRemarks || 'Court stay active on current World State',
                issuedBy: 'judiciary-com',
                txId: record.lastTxId || '',
                date: ''
            });
        }

        // 4. Cadastral Integrity Check
        const isCadastralValid = record.ownershipVerified !== false;

        // 5. Determine Nil EC (Form 16) vs Encumbered (Form 15)
        const isCleanTitle = (unresolvedLiens.length === 0) && (unresolvedCourtStays.length === 0) && isCadastralValid;
        const txMs = this._getTxTimestampMs(ctx);
        const nowIso = new Date(txMs).toISOString();
        const searchStartDate = record.regDate || '2020-01-01';

        const certificate = {
            certificateNo: `EC-${id}-${txMs.toString(36).toUpperCase()}`,
            propertyId: id,
            propertyTitle: record.title || 'Property Record',
            propertyAddress: record.address || '',
            // Structured Location on Certificate
            location: {
                state: record.state || 'Karnataka',
                district: record.district || 'Bangalore Urban',
                taluk: record.taluk || '',
                city: record.city || '',
                locality: record.locality || '',
                pincode: record.pincode || ''
            },
            surveyNumber: record.surveyNumber || 'PENDING',
            eKhataNo: record.eKhataNo || 'PENDING',
            jurisdiction: record.jurisdiction || 'municipal',
            currentOwner: record.owner,
            formType: isCleanTitle ? 'FORM_16_NIL_ENCUMBRANCE' : 'FORM_15_ENCUMBERED',
            certificateTitle: isCleanTitle
                ? 'Certificate of Nil Encumbrance (Form No. 16)'
                : 'Statement of Encumbrances Affecting Property (Form No. 15)',
            status: isCleanTitle ? 'CLEAN_MARKETABLE_TITLE' : 'DEFECTIVE_OR_ENCUMBERED',
            cleanTitle: isCleanTitle,
            searchPeriod: {
                from: searchStartDate,
                to: nowIso.split('T')[0]
            },
            summary: isCleanTitle
                ? `Cryptographic Root Search reveals NO active mortgages, financial charges, or judicial injunctions affecting "${id}" located at ${record.locality}, ${record.district} from ${searchStartDate} to date.`
                : `Root Search reveals ${unresolvedLiens.length} un-discharged mortgage charge(s) and ${unresolvedCourtStays.length} active judicial restraint(s).`,
            activeLiens: unresolvedLiens,
            activeCourtOrders: unresolvedCourtStays,
            cadastralVerified: isCadastralValid,
            cadastralAuthority: record.verifiedBy || 'PENDING',
            encumbranceHistoryCount: encLog.length,
            judicialOrdersCount: freezeLog.length,
            transferHistoryCount: Array.isArray(record.transferHistory) ? record.transferHistory.length : 0,
            generatedAt: nowIso,
            certifyingChannel: 'channel1',
            certifyingMsp: this._getMspId(ctx),
            disclaimer: 'This Encumbrance Certificate is cryptographically audited and verified across the distributed ledger consensus of the National Blockchain Framework.'
        };

        return certificate;
    }

    /**
     * Asserts that a property title is free from all historical un-discharged encumbrances,
     * active court stays, or revoked cadastral records before any market transaction proceeds.
     */
    async _verifyRootEncumbrance(ctx, record) {
        const ec = await this._buildEncumbranceCertificate(ctx, record);
        if (!ec.cleanTitle) {
            const reasons = [];
            if (ec.activeCourtOrders.length > 0) {
                reasons.push(`Active Court Order (${ec.activeCourtOrders.map(o => o.caseNo).join(', ')})`);
            }
            if (ec.activeLiens.length > 0) {
                reasons.push(`Un-discharged Bank Lien (${ec.activeLiens.map(l => l.remarks || l.type).join(', ')})`);
            }
            if (!ec.cadastralVerified) {
                reasons.push(`Cadastral ownership unverified by ${record.jurisdiction.toUpperCase()}`);
            }
            throw new Error(
                `Root Encumbrance Verification Failed for "${record.id}": Title is defective/encumbered (Form 15 issued). Reasons: ${reasons.join('; ')}.`
            );
        }
        return ec;
    }

    // ==========================================
    // INITIALIZATION & RECORD CHECKS
    // ==========================================

    /**
     * Initializes the ledger with reference properties spanning multiple districts and jurisdictions
     */
    async initLedger(ctx) {
        console.info('============= START : Initialize Property Ledger ===========');
        const initialProperties = [
            {
                id: 'PROP001',
                title: 'Sunrise Villa',
                state: 'Karnataka',
                district: 'Bangalore Urban',
                taluk: 'Bangalore North',
                city: 'Bangalore',
                locality: 'MG Road',
                pincode: '560001',
                address: '12, MG Road, Bangalore North, Bangalore Urban, Karnataka - 560001',
                area: '2400 sq.ft',
                type: 'Residential',
                jurisdiction: 'municipal',
                surveyNumber: 'SY-104/2B',
                eKhataNo: 'BBMP-A-88219',
                rawValue: 8500000,
                guidelineValue: 8500000,
                value: '₹85,00,000',
                owner: 'rahul@cdac.in',
                status: 'owned',
                image: 'villa',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: 'municipal-com',
                verificationDate: '2023-01-15',
                verificationTxId: 'INIT-TX-001',
                lastValuationRef: 'BBMP-VAL-2023-01',
                lastValuationDate: '2023-01-15',
                listedForSale: false,
                askingPrice: 8500000,
                stampDuty: 425000,
                registrationFee: 85000,
                regDate: '2023-01-15',
                blockNumber: 104,
                transferHistory: [],
                docType: 'PropertyRecord'
            },
            {
                id: 'PROP002',
                title: 'Green Meadows Plot',
                state: 'Karnataka',
                district: 'Bangalore Urban',
                taluk: 'Anekal',
                city: 'Bangalore',
                locality: 'Electronic City',
                pincode: '560100',
                address: '45, Electronic City, Anekal Taluk, Bangalore Urban, Karnataka - 560100',
                area: '1200 sq.ft',
                type: 'Plot',
                jurisdiction: 'panchayat',
                surveyNumber: 'SY-56/4A',
                eKhataNo: 'PANCH-F9-4412',
                rawValue: 4200000,
                guidelineValue: 4200000,
                value: '₹42,00,000',
                owner: 'rahul@cdac.in',
                status: 'owned',
                image: 'plot',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: 'panchayat-com',
                verificationDate: '2023-06-20',
                verificationTxId: 'INIT-TX-002',
                lastValuationRef: 'PANCH-VAL-2023-06',
                lastValuationDate: '2023-06-20',
                listedForSale: false,
                askingPrice: 4200000,
                stampDuty: 210000,
                registrationFee: 42000,
                regDate: '2023-06-20',
                blockNumber: 156,
                transferHistory: [],
                docType: 'PropertyRecord'
            },
            {
                id: 'PROP003',
                title: 'BlueSky Apartments — 3BHK',
                state: 'Karnataka',
                district: 'Bangalore Urban',
                taluk: 'Bangalore East',
                city: 'Bangalore',
                locality: 'Whitefield',
                pincode: '560066',
                address: '78, Whitefield, Bangalore East, Bangalore Urban, Karnataka - 560066',
                area: '1800 sq.ft',
                type: 'Apartment',
                jurisdiction: 'municipal',
                surveyNumber: 'SY-88/1',
                eKhataNo: 'BBMP-A-99201',
                rawValue: 6200000,
                guidelineValue: 6200000,
                value: '₹62,00,000',
                owner: 'priya@cdac.in',
                status: 'for_sale',
                image: 'apartment',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: 'municipal-com',
                verificationDate: '2022-11-10',
                verificationTxId: 'INIT-TX-003',
                lastValuationRef: 'BBMP-VAL-2022-11',
                lastValuationDate: '2022-11-10',
                listedForSale: true,
                askingPrice: 6200000,
                stampDuty: 310000,
                registrationFee: 62000,
                regDate: '2022-11-10',
                blockNumber: 88,
                transferHistory: [],
                docType: 'PropertyRecord'
            },
            {
                id: 'PROP004',
                title: 'Krishna Valley Farmland',
                state: 'Karnataka',
                district: 'Ramanagara',
                taluk: 'Ramanagara Taluk',
                city: 'Ramanagara',
                locality: 'Kasaba',
                pincode: '562159',
                address: 'Survey 23, Kasaba, Ramanagara Taluk, Ramanagara District, Karnataka - 562159',
                area: '2 Acres',
                type: 'Agricultural',
                jurisdiction: 'revenue',
                surveyNumber: 'SY-23/A1',
                eKhataNo: 'RTC-BHOOMI-7741',
                rawValue: 12000000,
                guidelineValue: 12000000,
                value: '₹1,20,00,000',
                owner: 'amit@cdac.in',
                status: 'for_sale',
                image: 'commercial',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: 'revenue-com',
                verificationDate: '2021-08-05',
                verificationTxId: 'INIT-TX-004',
                lastValuationRef: 'REV-VAL-2021-08',
                lastValuationDate: '2021-08-05',
                listedForSale: true,
                askingPrice: 12000000,
                stampDuty: 600000,
                registrationFee: 120000,
                regDate: '2021-08-05',
                blockNumber: 45,
                transferHistory: [],
                docType: 'PropertyRecord'
            },
            {
                id: 'PROP005',
                title: 'Chamundi Heritage Enclave',
                state: 'Karnataka',
                district: 'Mysore',
                taluk: 'Mysore Taluk',
                city: 'Mysore',
                locality: 'Gokulam',
                pincode: '570002',
                address: '15, Gokulam 3rd Stage, Mysore Taluk, Mysore District, Karnataka - 570002',
                area: '2100 sq.ft',
                type: 'Residential',
                jurisdiction: 'municipal',
                surveyNumber: 'SY-12/3',
                eKhataNo: 'MYS-A-44019',
                rawValue: 7500000,
                guidelineValue: 7500000,
                value: '₹75,00,000',
                owner: 'amit@cdac.in',
                status: 'for_sale',
                image: 'villa',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: 'municipal-com',
                verificationDate: '2023-09-12',
                verificationTxId: 'INIT-TX-005',
                lastValuationRef: 'MYS-VAL-2023-09',
                lastValuationDate: '2023-09-12',
                listedForSale: true,
                askingPrice: 7500000,
                stampDuty: 375000,
                registrationFee: 75000,
                regDate: '2023-09-12',
                blockNumber: 210,
                transferHistory: [],
                docType: 'PropertyRecord'
            }
        ];

        for (const prop of initialProperties) {
            this._ensureDefaults(prop);
            await ctx.stub.putState(prop.id, Buffer.from(this._canonicalStringify(prop)));
            console.info(`Property ${prop.id} initialized into world state.`);
        }
        console.info('============= END : Initialize Property Ledger ===========');
        return JSON.stringify({ status: 'SUCCESS', message: 'Ledger initialized successfully with 5 structured properties' });
    }

    /**
     * Check if a property record exists
     */
    async recordExists(ctx, id) {
        const propBytes = await ctx.stub.getState(id);
        return propBytes && propBytes.length > 0;
    }

    // ==========================================
    // CORE TRANSACTION FUNCTIONS
    // ==========================================

    /**
     * 1. addProperty (or createRecord)
     * Adds a new property to the ledger with full structured location, jurisdiction, and authority attributes.
     */
    async addProperty(ctx, ...args) {
        const parsedArgs = this._parseArgs(args);
        let id = parsedArgs[0];
        let arg2 = parsedArgs[1];
        let address = parsedArgs[2];
        let area = parsedArgs[3];
        let type = parsedArgs[4];
        let rawValue = parsedArgs[5];
        let owner = parsedArgs[6];
        let jurisdiction = parsedArgs[7];
        let surveyNumber = parsedArgs[8];
        let eKhataNo = parsedArgs[9];

        if (!id) {
            throw new Error('Property ID is mandatory');
        }

        const exists = await this.recordExists(ctx, id);
        if (exists) {
            throw new Error(`Property record with ID "${id}" already exists on the ledger.`);
        }

        let record = {};
        const today = this._getTxDate(ctx);

        // Case 1: Caller provided a JSON payload in arg2
        if (arg2 && typeof arg2 === 'string' && (arg2.trim().startsWith('{') || !address)) {
            try {
                const parsed = JSON.parse(arg2);
                const numVal = Number(parsed.rawValue || parsed.askingPrice || 0);
                const duties = this._calculateDuties(numVal);
                const validJurisdiction = (parsed.jurisdiction || 'municipal').toLowerCase();

                const state = parsed.state || 'Karnataka';
                const district = parsed.district || 'Bangalore Urban';
                const taluk = parsed.taluk || 'Bangalore North';
                const city = parsed.city || 'Bangalore';
                const locality = parsed.locality || parsed.area || 'Central';
                const pincode = parsed.pincode || '560001';

                const formattedAddress = parsed.address ||
                    `${parsed.doorStreet ? parsed.doorStreet + ', ' : ''}${locality}, ${taluk}, ${district}, ${state} - ${pincode}`;

                record = {
                    id: id,
                    title: parsed.title || 'Untitled Property',
                    state: state,
                    district: district,
                    taluk: taluk,
                    city: city,
                    locality: locality,
                    pincode: pincode,
                    address: formattedAddress,
                    area: parsed.area || '',
                    type: parsed.type || 'Residential',
                    jurisdiction: validJurisdiction,
                    surveyNumber: parsed.surveyNumber || parsed.surveyNo || 'PENDING',
                    eKhataNo: parsed.eKhataNo || parsed.khataNo || 'PENDING',
                    rawValue: numVal,
                    guidelineValue: Number(parsed.guidelineValue || numVal),
                    value: parsed.value || this._formatINR(numVal),
                    owner: parsed.owner ? parsed.owner.toLowerCase() : '',
                    status: parsed.status || 'owned',
                    image: parsed.image || 'villa',
                    encumbrance: Boolean(parsed.encumbrance === true || parsed.encumbrance === 'true'),
                    encumbranceType: parsed.encumbranceType || 'NONE',
                    encumbranceLog: parsed.encumbranceLog || [],
                    frozen: Boolean(parsed.frozen === true || parsed.frozen === 'true'),
                    freezeCaseNo: parsed.freezeCaseNo || '',
                    freezeRemarks: parsed.freezeRemarks || '',
                    freezeLog: parsed.freezeLog || [],
                    ownershipVerified: parsed.ownershipVerified !== false,
                    surveyVerified: parsed.surveyVerified !== false,
                    verifiedBy: parsed.verifiedBy || '',
                    verificationDate: parsed.verificationDate || '',
                    verificationTxId: parsed.verificationTxId || '',
                    lastValuationRef: parsed.lastValuationRef || '',
                    lastValuationDate: parsed.lastValuationDate || '',
                    listedForSale: false,
                    askingPrice: numVal,
                    stampDuty: duties.stampDuty,
                    registrationFee: duties.registrationFee,
                    regDate: parsed.regDate || today,
                    blockNumber: parsed.blockNumber || 0,
                    lastTxId: ctx.stub.getTxID(),
                    transferHistory: [],
                    docType: 'PropertyRecord'
                };
            } catch (err) {
                record = null;
            }
        }

        // Case 2: Positional arguments
        if (!record || Object.keys(record).length === 0) {
            const numVal = Number(rawValue || 0);
            const duties = this._calculateDuties(numVal);
            const validJurisdiction = (jurisdiction || 'municipal').toLowerCase();

            record = {
                id: id,
                title: arg2 || 'Untitled Property',
                state: 'Karnataka',
                district: 'Bangalore Urban',
                taluk: 'Bangalore North',
                city: 'Bangalore',
                locality: 'Central',
                pincode: '560001',
                address: address || 'Bangalore, Karnataka',
                area: area || '',
                type: type || 'Residential',
                jurisdiction: validJurisdiction,
                surveyNumber: surveyNumber || 'PENDING',
                eKhataNo: eKhataNo || 'PENDING',
                rawValue: numVal,
                guidelineValue: numVal,
                value: this._formatINR(numVal),
                owner: owner ? owner.toLowerCase() : '',
                status: 'owned',
                image: (type && type.toLowerCase().includes('plot')) ? 'plot' :
                       (type && type.toLowerCase().includes('commercial')) ? 'commercial' :
                       (type && type.toLowerCase().includes('apartment')) ? 'apartment' : 'villa',
                encumbrance: false,
                encumbranceType: 'NONE',
                encumbranceLog: [],
                frozen: false,
                freezeCaseNo: '',
                freezeRemarks: '',
                freezeLog: [],
                ownershipVerified: true,
                surveyVerified: true,
                verifiedBy: '',
                verificationDate: '',
                verificationTxId: '',
                lastValuationRef: '',
                lastValuationDate: '',
                listedForSale: false,
                askingPrice: numVal,
                stampDuty: duties.stampDuty,
                registrationFee: duties.registrationFee,
                regDate: today,
                blockNumber: 0,
                lastTxId: ctx.stub.getTxID(),
                transferHistory: [],
                docType: 'PropertyRecord'
            };
        }

        this._ensureDefaults(record);
        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property record ${id} successfully added by ${record.owner}.`);
        return this._canonicalStringify(record);
    }

    async createRecord(ctx, ...args) {
        const parsed = this._parseArgs(args);
        return this.addProperty(ctx, parsed[0], parsed[1], parsed[2], parsed[3], parsed[4], parsed[5], parsed[6], 'municipal', '', '');
    }

    /**
     * Admin Migration: Upsert a full PropertyRecord JSON snapshot (preserving history & listing state)
     * Access Control: Only sro-com
     */
    async importPropertyRecord(ctx, ...args) {
        this._assertMsp(ctx, ['sro-com'], 'importPropertyRecord');
        const parsedArgs = this._parseArgs(args);
        let id = parsedArgs[0];
        let payloadRaw = parsedArgs[1];
        if (!payloadRaw && typeof id === 'string' && id.trim().startsWith('{')) {
            payloadRaw = id;
            id = '';
        }
        const record = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : payloadRaw;
        if (!record || typeof record !== 'object') {
            throw new Error('Valid PropertyRecord JSON payload is mandatory for importPropertyRecord');
        }
        const targetId = id || record.id;
        if (!targetId) {
            throw new Error('Property ID is mandatory for importPropertyRecord');
        }
        record.id = targetId;
        record.docType = 'PropertyRecord';
        this._ensureDefaults(record);
        const serialized = this._canonicalStringify(record);
        await ctx.stub.putState(targetId, Buffer.from(serialized));
        return serialized;
    }

    /**
     * Admin Cleanup: Remove a PropertyRecord by ID from world state
     * Access Control: Only sro-com
     */
    async deletePropertyRecord(ctx, ...args) {
        this._assertMsp(ctx, ['sro-com'], 'deletePropertyRecord');
        const parsedArgs = this._parseArgs(args);
        const id = parsedArgs[0];
        if (!id) {
            throw new Error('Property ID is mandatory for deletePropertyRecord');
        }
        await ctx.stub.deleteState(id);
        return JSON.stringify({ status: 'DELETED', id });
    }

    /**
     * 2. retrieveProperty (or queryRecord)
     * Reads a property record from the blockchain world state.
     */
    async retrieveProperty(ctx, ...args) {
        const parsed = this._parseArgs(args);
        let id = parsed[0];
        if (!id) {
            throw new Error('Property ID is mandatory for retrieveProperty');
        }

        const propBytes = await ctx.stub.getState(id);
        if (!propBytes || propBytes.length === 0) {
            throw new Error(`Property record with ID "${id}" does not exist on the ledger.`);
        }

        const record = JSON.parse(propBytes.toString('utf8'));
        this._ensureDefaults(record);
        return JSON.stringify(record);
    }

    async queryRecord(ctx, ...args) {
        return this.retrieveProperty(ctx, ...args);
    }

    /**
     * 3. listPropertyForSale
     */
    async listPropertyForSale(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const askingPrice = parsed[1];
        const sellerEmail = parsed[2];

        if (!id) {
            throw new Error('Property ID is mandatory');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        if (sellerEmail) {
            const normalizedSeller = sellerEmail.trim().toLowerCase();
            if (record.owner.toLowerCase() !== normalizedSeller) {
                throw new Error(
                    `Ownership Check Failed: Caller "${sellerEmail}" is not the registered owner of property "${id}". Current owner: "${record.owner}".`
                );
            }
        }

        await this._verifyRootEncumbrance(ctx, record);

        const newAskingPrice = askingPrice ? Number(askingPrice) : record.rawValue;
        const duties = this._calculateDuties(newAskingPrice);

        record.listedForSale = true;
        record.status = 'for_sale';
        record.askingPrice = newAskingPrice;
        record.rawValue = newAskingPrice;
        record.value = this._formatINR(newAskingPrice);
        record.stampDuty = duties.stampDuty;
        record.registrationFee = duties.registrationFee;
        record.lastTxId = ctx.stub.getTxID();
        record.listedDate = this._getTxDate(ctx);

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} successfully verified and listed for sale by ${record.owner}.`);
        return this._canonicalStringify(record);
    }

    /**
     * 4. buyProperty
     */
    async buyProperty(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const buyerEmail = parsed[1];
        const paymentRef = parsed[2];

        if (!id || !buyerEmail) {
            throw new Error('Property ID and buyerEmail are mandatory for purchase');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        if (!record.listedForSale || record.status !== 'for_sale') {
            throw new Error(`Property "${id}" is not listed for sale (current status: ${record.status}).`);
        }

        const normalizedBuyer = buyerEmail.trim().toLowerCase();
        if (record.owner.toLowerCase() === normalizedBuyer) {
            throw new Error(`Buyer "${buyerEmail}" is already the registered owner of property "${id}".`);
        }

        await this._verifyRootEncumbrance(ctx, record);

        if (!paymentRef) {
            throw new Error(
                `Payment / Stamp Duty Endorsement Missing: Valid challan or bank payment reference is required.`
            );
        }

        const previousOwner = record.owner;
        const txId = ctx.stub.getTxID();
        const txDate = this._getTxDate(ctx);

        record.transferHistory.push({
            txId: txId,
            from: previousOwner,
            to: normalizedBuyer,
            amount: record.askingPrice || record.rawValue,
            stampDuty: record.stampDuty,
            registrationFee: record.registrationFee,
            paymentRef: paymentRef,
            date: txDate,
            jurisdiction: record.jurisdiction,
            location: {
                district: record.district,
                taluk: record.taluk,
                locality: record.locality,
                pincode: record.pincode
            }
        });

        record.previousOwner = previousOwner;
        record.owner = normalizedBuyer;
        record.status = 'owned';
        record.listedForSale = false;
        record.challanNo = paymentRef;
        record.lastTxId = txId;
        record.lastTransferDate = txDate;

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} successfully transferred from ${previousOwner} to ${normalizedBuyer}. Tx: ${txId}`);
        return this._canonicalStringify(record);
    }

    async transferOwnership(ctx, ...args) {
        const parsed = this._parseArgs(args);
        return this.buyProperty(ctx, parsed[0], parsed[1], parsed[2] || 'CHALLAN-DIRECT');
    }

    /**
     * delistProperty: Removes a property from active sale listings
     */
    async delistProperty(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const sellerEmail = parsed[1];

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        if (sellerEmail && record.owner.toLowerCase() !== sellerEmail.trim().toLowerCase()) {
            throw new Error(`Only current owner can delist property "${id}".`);
        }

        record.listedForSale = false;
        record.status = 'owned';
        record.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        return this._canonicalStringify(record);
    }

    // ==========================================
    // MULTI-ORG GOVERNANCE FUNCTIONS
    // ==========================================

    /**
     * Set Encumbrance Status
     * Access Control: Only bank-com OR judiciary-com
     */
    async setEncumbranceStatus(ctx, ...args) {
        this._assertMsp(ctx, ['bank-com', 'judiciary-com'], 'setEncumbranceStatus');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const status = parsed[1];
        const remarks = parsed[2];
        const encumbranceType = parsed[3];

        if (!id) {
            throw new Error('Property ID is required');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const isEncumbered = Boolean(status === true || status === 'true');
        const callerMsp = this._getMspId(ctx);
        const txId = ctx.stub.getTxID();
        const today = this._getTxDate(ctx);

        let finalType = encumbranceType;
        if (!finalType) {
            if (callerMsp === 'bank-com') finalType = 'BANK_MORTGAGE';
            else if (callerMsp === 'judiciary-com') finalType = 'COURT_ORDER';
            else finalType = isEncumbered ? 'ENCUMBERED' : 'NONE';
        }

        record.encumbrance = isEncumbered;
        record.encumbranceType = isEncumbered ? finalType : 'NONE';
        record.encumbranceRemarks = remarks || '';
        record.lastTxId = txId;

        record.encumbranceLog.push({
            action: isEncumbered ? 'FLAGGED' : 'CLEARED',
            type: record.encumbranceType,
            remarks: remarks || '',
            mspId: callerMsp,
            txId: txId,
            date: today
        });

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        return this._canonicalStringify(record);
    }

    /**
     * Freeze Property (Court Injunction / Attachment Order)
     * Access Control: Only judiciary-com
     */
    async freezeProperty(ctx, ...args) {
        this._assertMsp(ctx, ['judiciary-com'], 'freezeProperty');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const caseNo = parsed[1];
        const remarks = parsed[2];

        if (!id || !caseNo) {
            throw new Error('Property ID and court Case Number are mandatory for freezeProperty');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const callerMsp = this._getMspId(ctx);
        const txId = ctx.stub.getTxID();
        const today = this._getTxDate(ctx);

        record.frozen = true;
        record.freezeCaseNo = caseNo;
        record.freezeRemarks = remarks || 'Injunction granted by Hon. Court';
        record.encumbrance = true;
        record.encumbranceType = 'COURT_ORDER';
        record.lastTxId = txId;

        const logEntry = {
            action: 'FROZEN',
            caseNo: caseNo,
            remarks: record.freezeRemarks,
            mspId: callerMsp,
            txId: txId,
            date: today
        };

        record.freezeLog.push(logEntry);
        record.encumbranceLog.push({
            action: 'FLAGGED',
            type: 'COURT_ORDER',
            remarks: `Court Order ${caseNo}: ${record.freezeRemarks}`,
            mspId: callerMsp,
            txId: txId,
            date: today
        });

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} frozen under court order ${caseNo} by ${callerMsp}`);
        return this._canonicalStringify(record);
    }

    /**
     * Unfreeze Property (Court Injunction Vacated / Discharged)
     * Access Control: Only judiciary-com
     */
    async unfreezeProperty(ctx, ...args) {
        this._assertMsp(ctx, ['judiciary-com'], 'unfreezeProperty');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const orderRef = parsed[1];
        const remarks = parsed[2];

        if (!id || !orderRef) {
            throw new Error('Property ID and Order Reference are mandatory for unfreezeProperty');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const callerMsp = this._getMspId(ctx);
        const txId = ctx.stub.getTxID();
        const today = this._getTxDate(ctx);

        record.frozen = false;
        record.freezeRemarks = `Unfrozen per ${orderRef}: ${remarks || ''}`;
        if (record.encumbranceType === 'COURT_ORDER') {
            record.encumbrance = false;
            record.encumbranceType = 'NONE';
        }
        record.lastTxId = txId;

        record.freezeLog.push({
            action: 'UNFROZEN',
            orderRef: orderRef,
            remarks: remarks || '',
            mspId: callerMsp,
            txId: txId,
            date: today
        });

        record.encumbranceLog.push({
            action: 'CLEARED',
            type: 'COURT_ORDER',
            remarks: `Court Order Vacation ${orderRef}: ${remarks || ''}`,
            mspId: callerMsp,
            txId: txId,
            date: today
        });

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} unfrozen under court order ${orderRef} by ${callerMsp}`);
        return this._canonicalStringify(record);
    }

    /**
     * Verify Authority Details (e-Khata / RTC / Survey Number)
     * Access Control: revenue-com, municipal-com, panchayat-com
     */
    async verifyAuthorityDetails(ctx, ...args) {
        this._assertMsp(ctx, ['revenue-com', 'municipal-com', 'panchayat-com'], 'verifyAuthorityDetails');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const eKhataNo = parsed[1];
        const surveyNumber = parsed[2];

        if (!id) {
            throw new Error('Property ID is mandatory');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const callerMsp = this._getMspId(ctx);
        const jurisdiction = (record.jurisdiction || 'municipal').toLowerCase();

        const allowedOrgMap = {
            'municipal': 'municipal-com',
            'revenue': 'revenue-com',
            'panchayat': 'panchayat-com'
        };

        const expectedMsp = allowedOrgMap[jurisdiction];
        if (callerMsp !== expectedMsp) {
            throw new Error(
                `Jurisdiction Mismatch: Caller MSP "${callerMsp}" is not authorized to verify property "${id}" under "${jurisdiction}" jurisdiction (Requires "${expectedMsp}").`
            );
        }

        if (eKhataNo) record.eKhataNo = eKhataNo;
        if (surveyNumber) record.surveyNumber = surveyNumber;

        const txId = ctx.stub.getTxID();
        const today = this._getTxDate(ctx);

        record.ownershipVerified = true;
        record.surveyVerified = true;
        record.verifiedBy = callerMsp;
        record.verificationDate = today;
        record.verificationTxId = txId;
        record.ownershipRevokedReason = '';
        record.lastTxId = txId;

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} authority verified by ${callerMsp}`);
        return this._canonicalStringify(record);
    }

    /**
     * Revoke Ownership Verification
     */
    async revokeOwnershipVerification(ctx, ...args) {
        this._assertMsp(ctx, ['revenue-com', 'municipal-com', 'panchayat-com'], 'revokeOwnershipVerification');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const reason = parsed[1];

        if (!id) {
            throw new Error('Property ID is mandatory');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const callerMsp = this._getMspId(ctx);
        const jurisdiction = (record.jurisdiction || 'municipal').toLowerCase();

        const allowedOrgMap = {
            'municipal': 'municipal-com',
            'revenue': 'revenue-com',
            'panchayat': 'panchayat-com'
        };

        const expectedMsp = allowedOrgMap[jurisdiction];
        if (callerMsp !== expectedMsp) {
            throw new Error(
                `Jurisdiction Mismatch: Caller MSP "${callerMsp}" is not authorized to revoke verification for "${id}" under "${jurisdiction}" jurisdiction.`
            );
        }

        const txId = ctx.stub.getTxID();
        record.ownershipVerified = false;
        record.ownershipRevokedReason = reason || 'Verification revoked pending dispute hearing';
        record.verifiedBy = '';
        record.lastTxId = txId;

        if (record.listedForSale) {
            record.listedForSale = false;
            record.status = 'owned';
        }

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        console.info(`Property ${id} ownership verification revoked by ${callerMsp}. Reason: ${reason}`);
        return this._canonicalStringify(record);
    }

    /**
     * Update Govt. Guideline Value & Valuation Reference
     */
    async updateValuation(ctx, ...args) {
        this._assertMsp(ctx, ['revenue-com', 'municipal-com', 'panchayat-com', 'sro-com'], 'updateValuation');

        const parsed = this._parseArgs(args);
        const id = parsed[0];
        const newGuidelineValue = parsed[1];
        const valuationRef = parsed[2];

        if (!id || newGuidelineValue === undefined) {
            throw new Error('Property ID and newGuidelineValue are mandatory');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        this._ensureDefaults(record);

        const numVal = Number(newGuidelineValue) || 0;
        const today = this._getTxDate(ctx);

        record.guidelineValue = numVal;
        record.lastValuationRef = valuationRef || 'ANNUAL-REVISION';
        record.lastValuationDate = today;

        const effectiveTaxBase = Math.max(record.rawValue || 0, numVal);
        const duties = this._calculateDuties(effectiveTaxBase);
        record.stampDuty = duties.stampDuty;
        record.registrationFee = duties.registrationFee;
        record.lastTxId = ctx.stub.getTxID();

        await ctx.stub.putState(id, Buffer.from(this._canonicalStringify(record)));
        return this._canonicalStringify(record);
    }

    /**
     * SRO Node: Calculate Stamp Duty & Registration Fees on demand
     */
    async calculateStampDuty(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const propertyValue = parsed[0];
        return JSON.stringify(this._calculateDuties(propertyValue));
    }

    // ==========================================
    // QUERIES & AUDIT REPORTS (READ-ONLY)
    // ==========================================

    /**
     * Query: All properties
     */
    async queryAllRecords(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString('utf8')).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                record = strValue;
            }
            if (record && record.docType === 'PropertyRecord') {
                this._ensureDefaults(record);
                allResults.push(record);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    /**
     * Query: Properties owned by a specific citizen/email
     */
    async queryRecordsByOwner(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const ownerEmail = parsed[0];

        if (!ownerEmail) {
            throw new Error('Owner email is required');
        }
        const targetEmail = ownerEmail.toLowerCase();
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const userRecords = allRecords.filter(p => p.owner && p.owner.toLowerCase() === targetEmail);
        return JSON.stringify(userRecords);
    }

    /**
     * Query: Properties listed for sale (Marketplace)
     */
    async queryListings(ctx) {
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);

        const listings = allRecords
            .filter(p => p.listedForSale === true)
            .map(p => {
                if (p.frozen) {
                    p.listingWarning = 'COURT_FROZEN';
                } else if (p.encumbrance) {
                    p.listingWarning = 'ENCUMBERED';
                } else if (p.ownershipVerified === false) {
                    p.listingWarning = 'UNVERIFIED';
                } else {
                    p.listingWarning = 'NONE';
                }
                return p;
            });

        return JSON.stringify(listings);
    }

    /**
     * Query: All encumbered properties (for Bank and SRO dashboards)
     */
    async queryEncumberedProperties(ctx) {
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const encumbered = allRecords.filter(p => p.encumbrance === true);
        return JSON.stringify(encumbered);
    }

    /**
     * Query: All frozen properties (for Judiciary and SRO dashboards)
     */
    async queryFrozenProperties(ctx) {
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const frozen = allRecords.filter(p => p.frozen === true);
        return JSON.stringify(frozen);
    }

    /**
     * Query: Properties by jurisdiction ('municipal', 'revenue', 'panchayat')
     */
    async queryByJurisdiction(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const jurisdictionType = parsed[0];

        if (!jurisdictionType) {
            throw new Error('Jurisdiction type is mandatory');
        }
        const target = jurisdictionType.toLowerCase().trim();
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const filtered = allRecords.filter(p => (p.jurisdiction || '').toLowerCase() === target);
        return JSON.stringify(filtered);
    }

    // ==========================================
    // SPATIAL & LOCATION QUERIES (NEW)
    // ==========================================

    /**
     * Query: Properties by District (e.g. 'Bangalore Urban', 'Ramanagara', 'Mysore')
     */
    async queryByDistrict(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const districtName = parsed[0];

        if (!districtName) {
            throw new Error('District name is required for queryByDistrict');
        }
        const target = districtName.toLowerCase().trim();
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const filtered = allRecords.filter(p => (p.district || '').toLowerCase().trim() === target);
        return JSON.stringify(filtered);
    }

    /**
     * Query: Properties by Pincode (e.g. '560001', '560066')
     */
    async queryByPincode(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const pincode = parsed[0];

        if (!pincode) {
            throw new Error('Pincode is required for queryByPincode');
        }
        const target = String(pincode).trim();
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const filtered = allRecords.filter(p => String(p.pincode || '').trim() === target);
        return JSON.stringify(filtered);
    }

    /**
     * Query: Flexible Multi-criteria Location Filter
     * Accepts a JSON string or positional parameters:
     * e.g. { district: 'Bangalore Urban', locality: 'Whitefield', pincode: '560066' }
     */
    async queryByLocation(ctx, ...args) {
        const parsed = this._parseArgs(args);
        let filterObj = {};

        if (parsed[0] && typeof parsed[0] === 'string' && parsed[0].trim().startsWith('{')) {
            try {
                filterObj = JSON.parse(parsed[0]);
            } catch (e) {
                filterObj = {};
            }
        } else if (parsed[0] && typeof parsed[0] === 'object') {
            filterObj = parsed[0];
        } else {
            filterObj = {
                district: parsed[0],
                locality: parsed[1],
                pincode: parsed[2]
            };
        }

        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);

        const filtered = allRecords.filter(p => {
            if (filterObj.state && (p.state || '').toLowerCase() !== filterObj.state.toLowerCase().trim()) {
                return false;
            }
            if (filterObj.district && (p.district || '').toLowerCase() !== filterObj.district.toLowerCase().trim()) {
                return false;
            }
            if (filterObj.taluk && (p.taluk || '').toLowerCase() !== filterObj.taluk.toLowerCase().trim()) {
                return false;
            }
            if (filterObj.city && (p.city || '').toLowerCase() !== filterObj.city.toLowerCase().trim()) {
                return false;
            }
            if (filterObj.locality && (p.locality || '').toLowerCase() !== filterObj.locality.toLowerCase().trim()) {
                return false;
            }
            if (filterObj.pincode && String(p.pincode || '').trim() !== String(filterObj.pincode).trim()) {
                return false;
            }
            return true;
        });

        return JSON.stringify(filtered);
    }

    /**
     * Query: Distinct available locations across World State
     * Used by UI dashboards to dynamically populate District, Locality, and Pincode dropdowns.
     */
    async getDistinctLocations(ctx) {
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);

        const states = new Set();
        const districts = new Set();
        const taluks = new Set();
        const cities = new Set();
        const localities = new Set();
        const pincodes = new Set();

        for (const p of allRecords) {
            if (p.state) states.add(p.state);
            if (p.district) districts.add(p.district);
            if (p.taluk) taluks.add(p.taluk);
            if (p.city) cities.add(p.city);
            if (p.locality) localities.add(p.locality);
            if (p.pincode) pincodes.add(String(p.pincode));
        }

        return JSON.stringify({
            states: Array.from(states).sort(),
            districts: Array.from(districts).sort(),
            taluks: Array.from(taluks).sort(),
            cities: Array.from(cities).sort(),
            localities: Array.from(localities).sort(),
            pincodes: Array.from(pincodes).sort()
        });
    }

    /**
     * Query: Properties pending authority ownership verification
     */
    async queryPendingVerification(ctx) {
        const allRecordsJson = await this.queryAllRecords(ctx);
        const allRecords = JSON.parse(allRecordsJson);
        const pending = allRecords.filter(p => p.ownershipVerified === false);
        return JSON.stringify(pending);
    }

    /**
     * Query: Audit history of a property
     */
    async getPropertyHistory(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];

        if (!id) {
            throw new Error('Property ID is required');
        }

        const iterator = await ctx.stub.getHistoryForKey(id);
        const history = [];

        let result = await iterator.next();
        while (!result.done) {
            const tx = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete
            };
            try {
                tx.value = JSON.parse(result.value.value.toString('utf8'));
            } catch (err) {
                tx.value = result.value.value.toString('utf8');
            }
            history.push(tx);
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(history);
    }

    /**
     * Generate Certified Encumbrance Certificate (EC)
     */
    async generateEncumbranceCertificate(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];

        if (!id) {
            throw new Error('Property ID is mandatory for generateEncumbranceCertificate');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        const certificate = await this._buildEncumbranceCertificate(ctx, record);
        return JSON.stringify(certificate);
    }

    /**
     * Query: Quick Root Title Sanity Check
     */
    async verifyRootTitle(ctx, ...args) {
        const parsed = this._parseArgs(args);
        const id = parsed[0];

        if (!id) {
            throw new Error('Property ID is mandatory for verifyRootTitle');
        }

        const recordString = await this.retrieveProperty(ctx, id);
        const record = JSON.parse(recordString);
        const ec = await this._buildEncumbranceCertificate(ctx, record);
        return JSON.stringify({
            propertyId: id,
            cleanTitle: ec.cleanTitle,
            formType: ec.formType,
            status: ec.status,
            activeLiensCount: ec.activeLiens.length,
            activeCourtOrdersCount: ec.activeCourtOrders.length,
            cadastralVerified: ec.cadastralVerified,
            summary: ec.summary,
            location: ec.location
        });
    }
}

module.exports = PropertyContract;
