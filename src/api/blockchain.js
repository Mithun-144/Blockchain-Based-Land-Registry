/**
 * NBF-Lite Blockchain API Layer
 * All storage and transaction calls go through this module.
 * 
 * Supports both:
 * 1. Mock mode (interactive in-memory / localStorage simulation of Hyperledger Fabric)
 * 2. Live NBF-Lite REST API mode
 */

const STORAGE_KEY_PROPS_V2 = 'propchain_all_properties_v3';
const STORAGE_KEY_CONFIG = 'propchain_network_config_v1';
const STORAGE_KEY_USERS = 'propchain_users_registry_v1';

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  channel: 'localchannelone',
  chaincode: 'property',
  mspId: 'cdacMSP',
  mockMode: true,
};

export function getNetworkConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveNetworkConfig(cfg) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
}

// ── Multi-User Predefined Citizen Profiles ──
export const PRESET_USERS = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@cdac.in',
    alias: 'citizen@cdac.in',
    govId: 'AADHAR-8821-4521',
    org: 'cdacMSP',
    role: 'Citizen Buyer & Landowner',
    avatar: 'RS',
    avatarColor: '#2563eb',
    city: 'Bangalore, Karnataka',
  },
  {
    name: 'Priya Patel',
    email: 'priya@cdac.in',
    alias: 'seller@cdac.in',
    govId: 'AADHAR-9920-1123',
    org: 'cdacMSP',
    role: 'Citizen Landlord / Seller',
    avatar: 'PP',
    avatarColor: '#059669',
    city: 'Ahmedabad, Gujarat',
  },
  {
    name: 'Amit Kumar',
    email: 'amit@cdac.in',
    alias: 'investor@cdac.in',
    govId: 'AADHAR-4451-8890',
    org: 'cdacMSP',
    role: 'Commercial Real Estate Investor',
    avatar: 'AK',
    avatarColor: '#7c3aed',
    city: 'New Delhi, Delhi',
  },
  {
    name: 'Sunita Rao',
    email: 'sunita@cdac.in',
    alias: 'heritage@cdac.in',
    govId: 'AADHAR-6712-3349',
    org: 'cdacMSP',
    role: 'Heritage Estate Owner',
    avatar: 'SR',
    avatarColor: '#d97706',
    city: 'Hyderabad, Telangana',
  },
];

// ── Default preset passwords (each user has their own) ──
const PRESET_PASSWORDS = {
  'rahul@cdac.in': 'Rahul@2024',
  'priya@cdac.in': 'Priya@2024',
  'amit@cdac.in': 'Amit@2024',
  'sunita@cdac.in': 'Sunita@2024',
};

// ── User Registry (preset + registered users) ──
function getUserRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      // Initialize with preset users and their passwords
      const initial = {};
      PRESET_USERS.forEach((u) => {
        initial[u.email.toLowerCase()] = {
          ...u,
          password: PRESET_PASSWORDS[u.email.toLowerCase()] || 'Cdac@123',
        };
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveUserRegistry(registry) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(registry));
}

export function normalizeUserEmail(email) {
  if (!email) return 'rahul@cdac.in';
  const match = PRESET_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() ||
      u.alias?.toLowerCase() === email.toLowerCase()
  );
  return match ? match.email : email.toLowerCase();
}

const INITIAL_ALL_PROPERTIES = [
  // ── Rahul Sharma (rahul@cdac.in) — 4 properties ──
  {
    id: 'PROP001',
    title: 'Sunrise Villa',
    address: '12, MG Road, Bangalore - 560001',
    area: '2400 sq.ft',
    type: 'Residential',
    rawValue: 8500000,
    value: '₹85,00,000',
    owner: 'rahul@cdac.in',
    status: 'owned',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2023-01-15',
    blockNumber: 104,
  },
  {
    id: 'PROP002',
    title: 'Green Meadows Plot',
    address: '45, Electronic City, Bangalore - 560100',
    area: '1200 sq.ft',
    type: 'Plot',
    rawValue: 4200000,
    value: '₹42,00,000',
    owner: 'rahul@cdac.in',
    status: 'owned',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2023-06-20',
    blockNumber: 156,
  },
  {
    id: 'PROP007',
    title: 'Maple Garden Residence',
    address: '29, Sarjapur Road, Bangalore - 560035',
    area: '1800 sq.ft',
    type: 'Residential',
    rawValue: 7200000,
    value: '₹72,00,000',
    owner: 'rahul@cdac.in',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2022-03-10',
    blockNumber: 58,
  },
  {
    id: 'PROP008',
    title: 'Prestige Towers — 2BHK',
    address: '14, Bannerghatta Road, Bangalore - 560076',
    area: '1100 sq.ft',
    type: 'Apartment',
    rawValue: 4800000,
    value: '₹48,00,000',
    owner: 'rahul@cdac.in',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2024-01-22',
    blockNumber: 201,
  },

  // ── Priya Patel (priya@cdac.in) — 4 properties ──
  {
    id: 'PROP003',
    title: 'BlueSky Apartments — 3BHK',
    address: '78, Whitefield, Bangalore - 560066',
    area: '1800 sq.ft',
    type: 'Apartment',
    rawValue: 6200000,
    value: '₹62,00,000',
    owner: 'priya@cdac.in',
    status: 'for_sale',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2022-11-10',
    blockNumber: 88,
  },
  {
    id: 'PROP006',
    title: 'Cyber Heights Residency',
    address: '88, Indiranagar 100ft Rd, Bangalore - 560038',
    area: '1650 sq.ft',
    type: 'Apartment',
    rawValue: 5500000,
    value: '₹55,00,000',
    owner: 'priya@cdac.in',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2023-09-12',
    blockNumber: 172,
  },
  {
    id: 'PROP009',
    title: 'Orchid Valley Plot',
    address: '67, Devanahalli, Bangalore - 562110',
    area: '2400 sq.ft',
    type: 'Plot',
    rawValue: 3600000,
    value: '₹36,00,000',
    owner: 'priya@cdac.in',
    status: 'for_sale',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2021-08-05',
    blockNumber: 34,
  },
  {
    id: 'PROP010',
    title: 'Lakeview Independent House',
    address: '3, Hebbal Lake Road, Bangalore - 560024',
    area: '3200 sq.ft',
    type: 'Residential',
    rawValue: 14500000,
    value: '₹1,45,00,000',
    owner: 'priya@cdac.in',
    status: 'owned',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2020-12-18',
    blockNumber: 22,
  },

  // ── Amit Kumar (amit@cdac.in) — 4 properties ──
  {
    id: 'PROP004',
    title: 'Tech Park Commercial Space',
    address: '23, Koramangala, Bangalore - 560034',
    area: '3200 sq.ft',
    type: 'Commercial',
    rawValue: 12000000,
    value: '₹1,20,00,000',
    owner: 'amit@cdac.in',
    status: 'for_sale',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2022-04-18',
    blockNumber: 62,
  },
  {
    id: 'PROP011',
    title: 'Brigade Gateway Office Suite',
    address: '101, Rajajinagar, Bangalore - 560010',
    area: '2800 sq.ft',
    type: 'Commercial',
    rawValue: 18000000,
    value: '₹1,80,00,000',
    owner: 'amit@cdac.in',
    status: 'owned',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2023-07-30',
    blockNumber: 165,
  },
  {
    id: 'PROP012',
    title: 'Embassy Springs Villa',
    address: '44, Devanahalli North, Bangalore - 562110',
    area: '3800 sq.ft',
    type: 'Residential',
    rawValue: 22000000,
    value: '₹2,20,00,000',
    owner: 'amit@cdac.in',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2021-05-14',
    blockNumber: 29,
  },
  {
    id: 'PROP013',
    title: 'Manyata Residency — 4BHK',
    address: '9, Thanisandra Main Rd, Bangalore - 560077',
    area: '2200 sq.ft',
    type: 'Apartment',
    rawValue: 9500000,
    value: '₹95,00,000',
    owner: 'amit@cdac.in',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2024-02-08',
    blockNumber: 210,
  },

  // ── Sunita Rao (sunita@cdac.in) — 4 properties ──
  {
    id: 'PROP005',
    title: 'Lakefront Bungalow',
    address: '5, Yelahanka, Bangalore - 560064',
    area: '4500 sq.ft',
    type: 'Residential',
    rawValue: 21000000,
    value: '₹2,10,00,000',
    owner: 'sunita@cdac.in',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2021-09-05',
    blockNumber: 41,
  },
  {
    id: 'PROP014',
    title: 'Heritage Mansion',
    address: '1, Palace Road, Bangalore - 560001',
    area: '6000 sq.ft',
    type: 'Residential',
    rawValue: 35000000,
    value: '₹3,50,00,000',
    owner: 'sunita@cdac.in',
    status: 'owned',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2019-04-22',
    blockNumber: 11,
  },
  {
    id: 'PROP015',
    title: 'Sadashivanagar Corner Plot',
    address: '22, Sadashivanagar, Bangalore - 560080',
    area: '3600 sq.ft',
    type: 'Plot',
    rawValue: 16000000,
    value: '₹1,60,00,000',
    owner: 'sunita@cdac.in',
    status: 'for_sale',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2020-07-30',
    blockNumber: 18,
  },
  {
    id: 'PROP016',
    title: 'Sobha Marina — Penthouse',
    address: '55, Old Airport Road, Bangalore - 560017',
    area: '2800 sq.ft',
    type: 'Apartment',
    rawValue: 17500000,
    value: '₹1,75,00,000',
    owner: 'sunita@cdac.in',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2023-11-01',
    blockNumber: 189,
  },
];

function getAllProperties() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPS_V2);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROPS_V2, JSON.stringify(INITIAL_ALL_PROPERTIES));
      return INITIAL_ALL_PROPERTIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ALL_PROPERTIES;
  }
}

function saveAllProperties(props) {
  localStorage.setItem(STORAGE_KEY_PROPS_V2, JSON.stringify(props));
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Core REST invoker for live NBF-Lite chaincode calls
async function callFabricAPI(endpoint, payload) {
  const config = getNetworkConfig();
  const res = await fetch(`${config.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fabric API call failed (${res.status}): ${errorText}`);
  }
  return res.json();
}

export const BlockchainAPI = {
  // ── Authentication ──
  login: async (email, password) => {
    await delay(400);
    const registry = getUserRegistry();
    const normalizedEmail = email.toLowerCase();

    // Check by alias first
    const aliasMatch = PRESET_USERS.find(
      (u) => u.alias?.toLowerCase() === normalizedEmail
    );
    const lookupEmail = aliasMatch ? aliasMatch.email.toLowerCase() : normalizedEmail;

    const record = registry[lookupEmail];
    if (!record) {
      return { ok: false, error: 'No account found for this email. Please register first.' };
    }
    if (record.password !== password) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }
    // Return user without the password field
    const { password: _pw, ...user } = record;
    return { ok: true, user };
  },

  // ── Registration ──
  registerUser: async (email, password, name) => {
    await delay(500);
    const registry = getUserRegistry();
    const normalizedEmail = email.toLowerCase();

    if (registry[normalizedEmail]) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const displayName = name?.trim() ||
      email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const newUser = {
      name: displayName,
      email: normalizedEmail,
      govId: `AADHAR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      org: 'cdacMSP',
      role: 'Registered Citizen',
      avatar: displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: '#0891b2',
      city: 'India',
      password,
    };

    registry[normalizedEmail] = newUser;
    saveUserRegistry(registry);

    const { password: _pw, ...user } = newUser;
    return { ok: true, user };
  },

  getUsers: () => PRESET_USERS,

  // ── Read Properties for Specific User ──
  getMyProperties: async (userEmail) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'getMyProperties',
        args: [userEmail || ''],
      });
    }
    await delay(300);
    const targetEmail = normalizeUserEmail(userEmail);
    const all = getAllProperties();
    return all.filter((p) => normalizeUserEmail(p.owner) === targetEmail);
  },

  // ── Read Active Marketplace Listings ──
  getListings: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'queryPropertyListings',
        args: [],
      });
    }
    await delay(300);
    const all = getAllProperties();
    return all.filter((p) => p.listedForSale === true);
  },

  getProperty: async (id) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'queryProperty',
        args: [id],
      });
    }
    await delay(200);
    const all = getAllProperties();
    return all.find((p) => p.id === id) || null;
  },

  // ── Register New Property ──
  registerProperty: async (propData) => {
    const config = getNetworkConfig();
    const id = `PROP${String(Math.floor(Math.random() * 900) + 100)}`;
    const newProp = {
      ...propData,
      id,
      owner: normalizeUserEmail(propData.owner),
      status: 'owned',
      rawValue: Number(propData.rawValue || 5000000),
      value: `₹${Number(propData.rawValue || 5000000).toLocaleString('en-IN')}`,
      encumbrance: false,
      restrictions: false,
      listedForSale: false,
      regDate: new Date().toISOString().split('T')[0],
      blockNumber: Math.floor(Math.random() * 800) + 200,
    };

    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/invoke', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'registerProperty',
        args: [
          id,
          newProp.title,
          newProp.address,
          newProp.area,
          newProp.type,
          String(newProp.rawValue),
          newProp.owner,
        ],
      });
    }

    await delay(600);
    const existing = getAllProperties();
    const updated = [newProp, ...existing];
    saveAllProperties(updated);
    return newProp;
  },

  // ── Delist Property ──
  delistProperty: async (propertyId) => {
    await delay(400);
    const props = getAllProperties();
    const updated = props.map((p) =>
      p.id === propertyId ? { ...p, listedForSale: false, status: 'owned' } : p
    );
    saveAllProperties(updated);
    return { ok: true, propertyId };
  },

  // ── Step 1.i: SRO Node Check & Endorsement ──
  verifySroNode: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'verifySroEncumbrance',
        args: [propertyId],
      });
    }
    await delay(1100);
    const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    return {
      node: 'SRO Office Peer (peer0.sro.gov.in:7051)',
      mspId: 'SroMSP',
      propertyId,
      mortgageStatus: 'Clear (No Active Mortgages / Liens)',
      cERSAICheck: 'PASSED (0 Encumbrance Notices)',
      subRegistrarLien: 'NIL',
      status: 'ENDORSED',
      endorsementSignature: sigHash,
      timestamp: new Date().toISOString(),
      verifiedBy: 'Sub-Registrar Officer (X.509 Certificate Valid)',
    };
  },

  // ── Step 1.ii: Tahsildar Office Node Check & Endorsement ──
  verifyTahsildarNode: async (propertyId, sellerId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'verifyTahsildarOwnership',
        args: [propertyId, sellerId],
      });
    }
    await delay(1250);
    const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Determine portal based on property type
    const prop = getAllProperties().find((p) => p.id === propertyId);
    const pType = prop?.type || 'Residential';
    let portalDetails;
    if (pType === 'Plot' || pType === 'Agricultural') {
      portalDetails = {
        recordType: 'Pahani',
        managingDept: 'Revenue Department',
        digitalPortal: 'Bhoomi Portal',
        portalUrl: 'https://landrecords.karnataka.gov.in/',
        badge: 'MATCH',
      };
    } else if (pType === 'Rural Non-Ag') {
      portalDetails = {
        recordType: 'Form 9 & 11',
        managingDept: 'RDPR Department',
        digitalPortal: 'e-Swathu Portal',
        portalUrl: 'https://eswathu.karnataka.gov.in/',
        badge: 'MATCH',
      };
    } else {
      // Urban: Residential, Apartment, Commercial
      portalDetails = {
        recordType: 'e-Khata',
        managingDept: 'Urban Local Bodies (BBMP / DMA)',
        digitalPortal: 'e-Aasthi Portal',
        portalUrl: 'https://eaasthi.karnataka.gov.in/',
        badge: 'MATCH',
      };
    }

    return {
      node: 'Tahsildar Revenue Peer (peer0.tahsildar.gov.in:8051)',
      mspId: 'TahsildarMSP',
      propertyId,
      verifiedSeller: sellerId,
      rightfulOwnerStatus: 'CONFIRMED (Sole Legal Title Holder)',
      portalDetails,
      cadastralSurveyCheck: 'Boundary Geo-coordinates Compliant',
      status: 'ENDORSED',
      endorsementSignature: sigHash,
      timestamp: new Date().toISOString(),
      verifiedBy: 'Taluk Tahsildar / Revenue Authority (X.509 Certified)',
    };
  },

  // ── Step 2: Stamp Duty & Registration Calculation & Payment ──
  calculateStampDuty: async (propertyId, amount, areaType = 'Urban') => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'calculateStampDuty',
        args: [propertyId, String(amount), areaType],
      });
    }
    await delay(400);
    const numAmount = Number(amount);

    // Slab system for Base Stamp Duty:
    // Below ₹20 Lakhs: 2%
    // ₹20 Lakhs to ₹45 Lakhs: 3%
    // Above ₹45 Lakhs: 5%
    let stampDutyRate = 0.05;
    let slabName = 'Above ₹45 Lakhs (5%)';

    if (numAmount < 2000000) {
      stampDutyRate = 0.02;
      slabName = 'Below ₹20 Lakhs (2%)';
    } else if (numAmount <= 4500000) {
      stampDutyRate = 0.03;
      slabName = '₹20 Lakhs to ₹45 Lakhs (3%)';
    }

    const baseStampDuty = Math.round(numAmount * stampDutyRate);
    const cess = Math.round(baseStampDuty * 0.10); // Base Stamp Duty × 10%
    const surchargeRate = areaType === 'Rural' ? 0.03 : 0.02;
    const surcharge = Math.round(baseStampDuty * surchargeRate); // Base Stamp Duty × 2% (Urban) or 3% (Rural)

    const total = baseStampDuty + cess + surcharge;

    return {
      propertyId,
      propertyValue: numAmount,
      slabName,
      stampDutyRate,
      baseStampDuty,
      stampDuty: baseStampDuty,
      cess,
      areaType,
      surchargeRate,
      surcharge,
      total,
      currency: 'INR (₹)',
      calculatedAt: new Date().toISOString(),
    };
  },

  payStampDuty: async (propertyId, amount, paymentMethod = 'Cyber Treasury e-Challan (K2/IFMS)') => {
    const config = getNetworkConfig();
    await delay(900);
    const challanNo = `CHLN-2026-KRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentHash = `0x${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    return {
      status: 'PAID',
      challanNo,
      paymentMethod,
      amountPaid: amount,
      paymentHash,
      receiptTimestamp: new Date().toISOString(),
      stateTreasuryRef: 'ST-KRN-REVENUE-ONLINE',
    };
  },

  // ── Step 3: Package & Send to Orderer Node (Raft Consensus) ──
  sendToOrderer: async ({ propertyId, sroSig, tahsildarSig, challanNo, buyer, seller }) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/order', {
        channel: config.channel,
        chaincode: config.chaincode,
        payload: { propertyId, sroSig, tahsildarSig, challanNo, buyer, seller },
      });
    }
    await delay(1200);
    const blockNumber = Math.floor(Math.random() * 200) + 340;
    const txId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const merkleRoot = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      ordererNode: 'orderer.cdac.in:7050 (Raft Consensus Group)',
      txId,
      blockNumber,
      blockHash,
      merkleRoot,
      batchSize: '1 tx / block',
      packedAt: new Date().toISOString(),
      status: 'PACKED_INTO_BLOCK',
    };
  },

  // ── Step 4: Broadcast to Committing Peers & Commit to Ledger / CouchDB ──
  broadcastAndCommitLedger: async ({ propertyId, fromOwner, toOwner, blockData, challanNo }) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/commit', {
        channel: config.channel,
        chaincode: config.chaincode,
        args: [propertyId, fromOwner, toOwner, blockData.txId, challanNo],
      });
    }
    await delay(1400);

    // Update unified asset ledger
    const props = getAllProperties();
    const updatedProps = props.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          owner: normalizeUserEmail(toOwner),
          listedForSale: false,
          status: 'owned',
          blockNumber: blockData.blockNumber,
          lastTxId: blockData.txId,
          challanNo,
        };
      }
      return p;
    });
    saveAllProperties(updatedProps);

    const couchRevision = `2-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    return {
      status: 'COMMITTED',
      channel: config.channel || 'localchannelone',
      committedNodes: [
        {
          node: 'SRO Peer Node (peer0.sro.gov.in:7051)',
          ledgerUpdate: 'VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Tahsildar Peer Node (peer0.tahsildar.gov.in:8051)',
          ledgerUpdate: 'VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Revenue & Central Registry Peer (peer0.cdac.gov.in:9051)',
          ledgerUpdate: 'VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
      ],
      couchDbState: {
        _id: propertyId,
        _rev: couchRevision,
        docType: 'LandTitleAsset',
        owner: normalizeUserEmail(toOwner),
        previousOwner: normalizeUserEmail(fromOwner),
        status: 'REGISTERED_OWNER',
        stampChallan: challanNo,
        lastBlockNumber: blockData.blockNumber,
        lastTxId: blockData.txId,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  // ── Sell Flow: Send Listing to Orderer ──
  sendListingToOrderer: async ({ propertyId, askingPrice, sroSig, tahsildarSig, seller }) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/order', {
        channel: config.channel,
        chaincode: config.chaincode,
        payload: { fcn: 'listPropertyForSale', propertyId, askingPrice, sroSig, tahsildarSig, seller },
      });
    }
    await delay(1100);
    const blockNumber = Math.floor(Math.random() * 200) + 350;
    const txId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const merkleRoot = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      ordererNode: 'orderer.cdac.in:7050 (Raft Consensus Group)',
      txId,
      blockNumber,
      blockHash,
      merkleRoot,
      action: 'LIST_PROPERTY_FOR_SALE',
      packedAt: new Date().toISOString(),
      status: 'PACKED_INTO_BLOCK',
    };
  },

  // ── Sell Flow: Broadcast Listing to Peers & CouchDB State ──
  broadcastAndCommitListing: async ({ propertyId, askingPrice, blockData, seller }) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/commit', {
        channel: config.channel,
        chaincode: config.chaincode,
        args: [propertyId, askingPrice, blockData.txId, seller],
      });
    }
    await delay(1300);

    const props = getAllProperties();
    const formattedValue = `₹${Number(askingPrice || 5000000).toLocaleString('en-IN')}`;

    const updatedProps = props.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          listedForSale: true,
          status: 'for_sale',
          rawValue: Number(askingPrice || p.rawValue),
          value: formattedValue,
          blockNumber: blockData.blockNumber,
          lastTxId: blockData.txId,
        };
      }
      return p;
    });
    saveAllProperties(updatedProps);

    const couchRevision = `2-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    return {
      status: 'COMMITTED',
      channel: config.channel || 'localchannelone',
      committedNodes: [
        {
          node: 'SRO Peer Node (peer0.sro.gov.in:7051)',
          ledgerUpdate: 'LISTING_VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Tahsildar Peer Node (peer0.tahsildar.gov.in:8051)',
          ledgerUpdate: 'LISTING_VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Marketplace & Registry Peer (peer0.cdac.gov.in:9051)',
          ledgerUpdate: 'LISTING_VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
      ],
      couchDbState: {
        _id: propertyId,
        _rev: couchRevision,
        docType: 'LandTitleAsset',
        owner: normalizeUserEmail(seller),
        status: 'FOR_SALE',
        listedForSale: true,
        askingPrice: formattedValue,
        lastBlockNumber: blockData.blockNumber,
        lastTxId: blockData.txId,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  // ── Backward Compatible / Legacy wrappers ──
  transferOwnership: async (propertyId, fromOwner, toOwner, deedId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/invoke', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'transferOwnership',
        args: [propertyId, fromOwner, toOwner, deedId],
      });
    }
    await delay(1200);

    const listings = getStoredListings();
    const props = getStoredProps();
    const targetProp = listings.find((p) => p.id === propertyId) || props.find((p) => p.id === propertyId);

    if (targetProp) {
      const updatedProp = {
        ...targetProp,
        owner: toOwner,
        listedForSale: false,
        status: 'owned',
      };
      const newProps = [updatedProp, ...props.filter((p) => p.id !== propertyId)];
      const newListings = listings.filter((p) => p.id !== propertyId);
      setStoredProps(newProps);
      setStoredListings(newListings);
    }

    return {
      txId: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      blockNumber: Math.floor(Math.random() * 500) + 300,
      timestamp: new Date().toISOString(),
      channel: config.channel,
      chaincode: config.chaincode,
      status: 'COMMITTED',
    };
  },

  // ── History ──
  getPropertyHistory: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'getPropertyHistory',
        args: [propertyId],
      });
    }
    await delay(350);
    return [
      {
        event: 'Property Registered on Hyperledger Fabric',
        date: '2021-03-15',
        by: 'registrar@cdac.in',
        txId: '0x94f8a1...4b22',
        block: '#42',
        icon: '🏛️',
      },
      {
        event: 'Encumbrance Clearance Issued',
        date: '2022-04-10',
        by: 'subregistrar@cdac.in',
        txId: '0xa721e0...9c11',
        block: '#87',
        icon: '⚖️',
      },
      {
        event: 'Ownership Transferred via Smart Contract',
        date: '2023-01-20',
        by: 'cdac-orderer-node',
        txId: '0x3ef12c...d88a',
        block: '#154',
        icon: '🔄',
      },
      {
        event: 'Listed on PropChain Marketplace',
        date: '2024-02-14',
        by: 'citizen@cdac.in',
        txId: '0x55dc90...77e4',
        block: '#210',
        icon: '🏷️',
      },
    ];
  },
};
