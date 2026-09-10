/**
 * NBF-Lite Blockchain API Layer
 * All storage and transaction calls go through this module.
 * 
 * Supports both:
 * 1. Mock mode (interactive in-memory / localStorage simulation of Hyperledger Fabric)
 * 2. Live NBF-Lite REST API mode
 */

const STORAGE_KEY_PROPS = 'propchain_properties_v1';
const STORAGE_KEY_LISTINGS = 'propchain_listings_v1';
const STORAGE_KEY_CONFIG = 'propchain_network_config_v1';

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

const INITIAL_PROPERTIES = [
  {
    id: 'PROP001',
    title: 'Sunrise Villa',
    address: '12, MG Road, Bangalore - 560001',
    area: '2400 sq.ft',
    type: 'Residential',
    rawValue: 8500000,
    value: '₹85,00,000',
    owner: 'citizen@cdac.in',
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
    owner: 'citizen@cdac.in',
    status: 'owned',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2023-06-20',
    blockNumber: 156,
  },
];

const INITIAL_LISTINGS = [
  {
    id: 'PROP003',
    title: 'BlueSky Apartments — 3BHK',
    address: '78, Whitefield, Bangalore - 560066',
    area: '1800 sq.ft',
    type: 'Apartment',
    rawValue: 6200000,
    value: '₹62,00,000',
    owner: 'seller@cdac.in',
    status: 'for_sale',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2022-11-10',
    blockNumber: 88,
  },
  {
    id: 'PROP004',
    title: 'Tech Park Commercial Space',
    address: '23, Koramangala, Bangalore - 560034',
    area: '3200 sq.ft',
    type: 'Commercial',
    rawValue: 12000000,
    value: '₹1,20,00,000',
    owner: 'investor@cdac.in',
    status: 'for_sale',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2022-04-18',
    blockNumber: 62,
  },
  {
    id: 'PROP005',
    title: 'Lakefront Bungalow',
    address: '5, Yelahanka, Bangalore - 560064',
    area: '4500 sq.ft',
    type: 'Residential',
    rawValue: 21000000,
    value: '₹2,10,00,000',
    owner: 'heritage@cdac.in',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2021-09-05',
    blockNumber: 41,
  },
];

function getStoredProps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPS);
    return raw ? JSON.parse(raw) : INITIAL_PROPERTIES;
  } catch {
    return INITIAL_PROPERTIES;
  }
}

function setStoredProps(props) {
  localStorage.setItem(STORAGE_KEY_PROPS, JSON.stringify(props));
}

function getStoredListings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTINGS);
    return raw ? JSON.parse(raw) : INITIAL_LISTINGS;
  } catch {
    return INITIAL_LISTINGS;
  }
}

function setStoredListings(listings) {
  localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
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
    await delay(600);
    if (password === 'Cdac@123') {
      return {
        ok: true,
        user: {
          name: 'Rahul Sharma',
          email,
          govId: 'AADHAR-8821-4521',
          org: 'cdacMSP',
          role: 'Citizen',
        },
      };
    }
    return { ok: false, error: 'Invalid credentials. Password is Cdac@123' };
  },

  // ── Read Properties ──
  getMyProperties: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'getMyProperties',
        args: [],
      });
    }
    await delay(400);
    return getStoredProps();
  },

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
    await delay(400);
    return getStoredListings();
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
    await delay(250);
    const all = [...getStoredProps(), ...getStoredListings()];
    return all.find((p) => p.id === id) || null;
  },

  // ── Register New Property ──
  registerProperty: async (propData) => {
    const config = getNetworkConfig();
    const id = `PROP${String(Math.floor(Math.random() * 900) + 100)}`;
    const newProp = {
      ...propData,
      id,
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

    await delay(800);
    const existing = getStoredProps();
    const updated = [newProp, ...existing];
    setStoredProps(updated);
    return newProp;
  },

  // ── Flow Diagram Step 1: Automated Checks ──
  automatedCheck: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'automatedCheck',
        args: [propertyId],
      });
    }
    await delay(900);
    return {
      propertyId,
      ownershipVerified: true,
      cadastralSurveyMatch: true,
      propertyTaxClearance: true,
      geoCoordinatesMatch: true,
      status: 'VERIFIED',
    };
  },

  // ── Flow Diagram Step 2: Encumbrance Check ──
  encumbranceCheck: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'encumbranceCheck',
        args: [propertyId],
      });
    }
    await delay(800);
    return {
      propertyId,
      hasBankMortgages: false,
      hasPendingDues: false,
      hasLegalLiabilities: false,
      status: 'CLEAR',
    };
  },

  // ── Flow Diagram Step 3: Restrictions Check ──
  restrictionsCheck: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'restrictionsCheck',
        args: [propertyId],
      });
    }
    await delay(800);
    return {
      propertyId,
      hasCourtInjunctions: false,
      hasGovernmentAcquisition: false,
      zoningCompliance: true,
      status: 'UNRESTRICTED',
    };
  },

  // ── Flow Diagram Step 4: Stamp Duty & Registration ──
  calculateStampDuty: async (propertyId, amount) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/query', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'calculateStampDuty',
        args: [propertyId, String(amount)],
      });
    }
    await delay(700);
    const stampDuty = Math.round(amount * 0.05); // 5%
    const regFee = Math.round(amount * 0.01); // 1%
    return {
      receiptId: `RCP-PAY-${Date.now().toString().slice(-6)}`,
      propertyValue: amount,
      stampDuty,
      regFee,
      total: stampDuty + regFee,
      timestamp: new Date().toISOString(),
      status: 'PAID',
    };
  },

  // ── Flow Diagram Step 5: Digital Signatures ──
  digitalSign: async (propertyId, role, signer) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/invoke', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'recordDigitalSignature',
        args: [propertyId, role, signer],
      });
    }
    await delay(600);
    return {
      role,
      signer,
      signatureHash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      signedAt: new Date().toISOString(),
      certificateStatus: 'VALID_X509',
    };
  },

  // ── Flow Diagram Step 6: Generate Digital Sale Deed ──
  generateDeed: async (propertyId, buyer, seller, amount) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      return callFabricAPI('/api/v1/transaction/invoke', {
        channel: config.channel,
        chaincode: config.chaincode,
        fcn: 'generateDigitalDeed',
        args: [propertyId, buyer, seller, String(amount)],
      });
    }
    await delay(900);
    const deedHash = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    return {
      deedId: `DEED-${propertyId}-${Date.now().toString().slice(-6)}`,
      propertyId,
      buyer,
      seller,
      amount,
      deedHash,
      generatedAt: new Date().toISOString(),
      notaryVerified: true,
    };
  },

  // ── Flow Diagram Step 7: Ownership Transfer to Blockchain ──
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

    // Update local state: move property from listings/seller to citizen's owned properties
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
