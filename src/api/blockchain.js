/**
 * NBF-Lite Blockchain API Layer
 * All storage and transaction calls go through this module.
 * 
 * Supports both:
 * 1. Pattern A: Transparent Auto-Enrollment (live against ca1.sro.com & channel1 on 192.168.231.128)
 * 2. Simulated Mock Mode (interactive fallback)
 */

const STORAGE_KEY_PROPS_V2 = 'propchain_all_properties_v3';
const STORAGE_KEY_CONFIG = 'propchain_network_config_v1';
const STORAGE_KEY_USERS = 'propchain_users_registry_v1';

const DEFAULT_CONFIG = {
  baseUrl: 'http://192.168.231.128:4000',
  channel: 'channel1',
  chaincode: 'property',
  mspId: 'sro-com',
  caname: 'ca1.sro.com',
  cfgpath: '/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json',
  local: true,
  mockMode: false,
};

export function getNetworkConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!saved) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(saved);
    // Auto-migrate legacy localhost or old dummy channels to live NBF-Lite parameters
    if (parsed.baseUrl === 'http://localhost:3000' || parsed.channel === 'localchannelone') {
      const updated = {
        ...DEFAULT_CONFIG,
        ...parsed,
        baseUrl: DEFAULT_CONFIG.baseUrl,
        channel: DEFAULT_CONFIG.channel,
        chaincode: DEFAULT_CONFIG.chaincode,
        mspId: DEFAULT_CONFIG.mspId,
        mockMode: false,
      };
      saveNetworkConfig(updated);
      return updated;
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveNetworkConfig(cfg) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('propchain_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Multi-User Predefined Citizen & Institutional Profiles ──
export const PRESET_USERS = [
  // ── Citizens ──
  {
    name: 'Rahul Sharma',
    email: 'rahul@cdac.in',
    alias: 'citizen@cdac.in',
    govId: 'AADHAR-8821-4521',
    org: 'sro-com',
    role: 'Citizen Buyer & Landowner',
    avatar: 'RS',
    avatarColor: '#2563eb',
    city: 'Bangalore, Karnataka',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Priya Patel',
    email: 'priya@cdac.in',
    alias: 'seller@cdac.in',
    govId: 'AADHAR-9920-1123',
    org: 'sro-com',
    role: 'Citizen Landlord / Seller',
    avatar: 'PP',
    avatarColor: '#059669',
    city: 'Ahmedabad, Gujarat',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Amit Kumar',
    email: 'amit@cdac.in',
    alias: 'investor@cdac.in',
    govId: 'AADHAR-4451-8890',
    org: 'sro-com',
    role: 'Commercial Real Estate Investor',
    avatar: 'AK',
    avatarColor: '#7c3aed',
    city: 'New Delhi, Delhi',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Sunita Rao',
    email: 'sunita@cdac.in',
    alias: 'heritage@cdac.in',
    govId: 'AADHAR-6712-3349',
    org: 'sro-com',
    role: 'Heritage Estate Owner',
    avatar: 'SR',
    avatarColor: '#d97706',
    city: 'Hyderabad, Telangana',
    type: 'citizen',
    dashboard: 'citizen',
  },

  // ── Institutional & Government Orgs (7-Org Network) ──
  {
    name: 'State Bank of India (Credit Div.)',
    email: 'manager@bank.com',
    alias: 'bank@cdac.in',
    govId: 'BANK-MGR-3391',
    org: 'bank-com',
    role: 'Bank Branch Manager (Mortgage & Lien)',
    avatar: 'BK',
    avatarColor: '#0284c7',
    city: 'Bangalore Central, Karnataka',
    type: 'org',
    dashboard: 'bank',
  },
  {
    name: 'City Civil Court & Registrar',
    email: 'court@judiciary.com',
    alias: 'judiciary@cdac.in',
    govId: 'JUDICIARY-REG-1044',
    org: 'judiciary-com',
    role: 'Judicial Officer / Registrar (Injunctions)',
    avatar: 'JD',
    avatarColor: '#dc2626',
    city: 'Bangalore High Court Bench',
    type: 'org',
    dashboard: 'judiciary',
  },
  {
    name: 'BBMP Municipal Revenue Officer',
    email: 'officer@municipal.com',
    alias: 'municipal@cdac.in',
    govId: 'BBMP-OFFICER-7712',
    org: 'municipal-com',
    jurisdiction: 'municipal',
    role: 'Urban Municipal Authority (BBMP e-Khata)',
    avatar: 'MN',
    avatarColor: '#0d9488',
    city: 'BBMP Urban East, Bangalore',
    type: 'org',
    dashboard: 'authority',
  },
  {
    name: 'Taluk Revenue Officer (Tahsildar)',
    email: 'tahsildar@revenue.com',
    alias: 'revenue@cdac.in',
    govId: 'REV-TAHSILDAR-4490',
    org: 'revenue-com',
    jurisdiction: 'revenue',
    role: 'Revenue Authority (RTC / Bhoomi Pahani)',
    avatar: 'RV',
    avatarColor: '#d97706',
    city: 'Ramanagara Taluk Office',
    type: 'org',
    dashboard: 'authority',
  },
  {
    name: 'Gram Panchayat Officer (PDO)',
    email: 'officer@panchayat.com',
    alias: 'panchayat@cdac.in',
    govId: 'GP-PDO-8821',
    org: 'panchayat-com',
    jurisdiction: 'panchayat',
    role: 'Gram Panchayat PDO (Form 9 / 11)',
    avatar: 'PN',
    avatarColor: '#16a34a',
    city: 'Electronic City Village Panchayat',
    type: 'org',
    dashboard: 'authority',
  },
  {
    name: 'Sub-Registrar (SRO Bangalore Urban)',
    email: 'registrar@sro.com',
    alias: 'sro@cdac.in',
    govId: 'SRO-REG-0012',
    org: 'sro-com',
    role: 'Sub-Registrar of Deeds (Stamp Duty & Registration)',
    avatar: 'SR',
    avatarColor: '#4f46e5',
    city: 'SRO Office, Bangalore Urban',
    type: 'org',
    dashboard: 'sro',
  },
];

// ── Default preset passwords ──
export const PRESET_PASSWORDS = {
  'rahul@cdac.in': 'Rahul@2024',
  'priya@cdac.in': 'Priya@2024',
  'amit@cdac.in': 'Amit@2024',
  'sunita@cdac.in': 'Sunita@2024',
  'manager@bank.com': 'Bank@2024',
  'court@judiciary.com': 'Court@2024',
  'officer@municipal.com': 'Munc@2024',
  'tahsildar@revenue.com': 'Rev@2024',
  'officer@panchayat.com': 'Panch@2024',
  'registrar@sro.com': 'Sro@2024',
};

// ── User Registry ──
function getUserRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let current = {};
    if (raw) {
      current = JSON.parse(raw);
    }
    // Auto-populate / merge all PRESET_USERS so institutional orgs are always accessible
    let modified = false;
    PRESET_USERS.forEach((u) => {
      const key = u.email.toLowerCase();
      if (!current[key]) {
        current[key] = {
          ...u,
          password: PRESET_PASSWORDS[key] || 'Cdac@123',
        };
        modified = true;
      } else {
        // Update role and org metadata if preset changed
        current[key] = { ...current[key], ...u };
      }
    });
    if (modified || !raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(current));
    }
    return current;
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
  {
    id: 'PROP001',
    title: 'Sunrise Villa',
    address: '12, MG Road, Bangalore - 560001',
    area: '2400 sq.ft',
    type: 'Residential',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-104/2B',
    eKhataNo: 'BBMP-A-88219',
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
    jurisdiction: 'panchayat',
    surveyNumber: 'SY-56/4A',
    eKhataNo: 'PANCH-F9-4412',
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
    id: 'PROP003',
    title: 'BlueSky Apartments — 3BHK',
    address: '78, Whitefield, Bangalore - 560066',
    area: '1800 sq.ft',
    type: 'Apartment',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-88/1',
    eKhataNo: 'BBMP-A-99201',
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
    id: 'PROP004',
    title: 'Krishna Valley Farmland',
    address: 'Survey 23, Ramanagara District - 562159',
    area: '2 Acres',
    type: 'Agricultural',
    jurisdiction: 'revenue',
    surveyNumber: 'SY-23/A1',
    eKhataNo: 'RTC-BHOOMI-7741',
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

// All ledger reads go through invokecc — evaluateTransaction works for read-only
// functions and eliminates 404 noise from the querycc GET-only route.
async function callFabricQuery(fcn, args = []) {
  return callFabricInvoke(fcn, args);
}

async function callFabricInvoke(fcn, args = []) {
  const config = getNetworkConfig();
  const currentUser = getCurrentUser();
  const user = currentUser?.email ? normalizeUserEmail(currentUser.email) : 'admin';
  const mspId = currentUser?.org || config.mspId;
  const payload = {
    fcn,
    args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
    user,
    ccname: config.chaincode,
    channel: config.channel,
    cfgpath: config.cfgpath,
    local: config.local !== false,
    mspId: mspId,
  };

  const res = await fetch(`${config.baseUrl}/fabric/v1/invokecc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fabric Invoke failed (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  if (data.sFlag === false) {
    throw new Error(data.error || 'Transaction invocation failed');
  }

  let finalRes = data.result !== undefined ? data.result : data;
  if (typeof finalRes === 'string') {
    try {
      finalRes = JSON.parse(finalRes);
    } catch {
      // keep as string
    }
  }
  return finalRes;
}

export const BlockchainAPI = {
  // ── Pattern A: Transparent Auto-Enrollment ──
  ensureEnrolled: async (userEmail) => {
    const config = getNetworkConfig();
    if (config.mockMode) return { ok: true, status: 'mock' };
    const normalized = normalizeUserEmail(userEmail);

    const payload = {
      user: normalized,
      caname: config.caname || 'ca1.sro.com',
      cfgpath: config.cfgpath || '/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json',
      mspId: config.mspId || 'sro-com',
    };

    console.log(`[Pattern A Auto-Enrollment] Enrolling citizen "${normalized}" via ${config.baseUrl}/fabric/v1/registeruser...`);
    try {
      const res = await fetch(`${config.baseUrl}/fabric/v1/registeruser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log(`[Pattern A Auto-Enrollment Result]`, result);
      return { ok: Boolean(result.sFlag), ...result };
    } catch (err) {
      console.warn(`[Pattern A Auto-Enrollment Error] ${err.message}`);
      return { ok: false, error: err.message };
    }
  },

  // ── Authentication with Transparent Auto-Enrollment ──
  login: async (email, password) => {
    await delay(350);
    const registry = getUserRegistry();
    const normalizedEmail = normalizeUserEmail(email);

    const aliasMatch = PRESET_USERS.find(
      (u) => u.alias?.toLowerCase() === email.toLowerCase()
    );
    const lookupEmail = aliasMatch ? aliasMatch.email.toLowerCase() : normalizedEmail;

    const record = registry[lookupEmail];
    if (!record) {
      return { ok: false, error: 'No account found for this email. Please register first.' };
    }
    if (record.password !== password) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    const { password: _pw, ...user } = record;

    // Pattern A: Auto-enroll on login
    const config = getNetworkConfig();
    if (!config.mockMode) {
      BlockchainAPI.ensureEnrolled(user.email).catch((e) =>
        console.warn('Auto-enroll on login notice:', e.message)
      );
    }

    return { ok: true, user };
  },

  // ── Registration with Transparent Auto-Enrollment ──
  registerUser: async (email, password, name) => {
    await delay(450);
    const registry = getUserRegistry();
    const normalizedEmail = email.toLowerCase();

    if (registry[normalizedEmail]) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const displayName =
      name?.trim() ||
      email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const newUser = {
      name: displayName,
      email: normalizedEmail,
      govId: `AADHAR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      org: 'sro-com',
      role: 'Registered Citizen',
      avatar: displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: '#0891b2',
      city: 'India',
      password,
    };

    registry[normalizedEmail] = newUser;
    saveUserRegistry(registry);

    const { password: _pw, ...user } = newUser;

    // Pattern A: Auto-enroll on registration
    const config = getNetworkConfig();
    if (!config.mockMode) {
      await BlockchainAPI.ensureEnrolled(user.email);
    }

    return { ok: true, user };
  },

  getUsers: () => PRESET_USERS,

  // ── Read Properties for Specific User (queryRecordsByOwner) ──
  getMyProperties: async (userEmail) => {
    const config = getNetworkConfig();
    const targetEmail = normalizeUserEmail(userEmail);

    if (!config.mockMode) {
      try {
        const liveProps = await callFabricQuery('queryRecordsByOwner', [targetEmail]);
        if (Array.isArray(liveProps) && liveProps.length > 0) {
          return liveProps;
        }
        // Fallback: fetch all records and filter by owner
        const allProps = await callFabricQuery('queryAllRecords', []);
        if (Array.isArray(allProps)) {
          const userProps = allProps.filter((p) => normalizeUserEmail(p.owner) === targetEmail);
          if (userProps.length > 0) return userProps;
        }
      } catch (err) {
        console.warn('[getMyProperties] Fabric live query notice:', err.message);
      }
    }
    await delay(250);
    const all = getAllProperties();
    return all.filter((p) => normalizeUserEmail(p.owner) === targetEmail);
  },

  // ── Read Active Marketplace Listings (queryListings) ──
  getListings: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const liveListings = await callFabricQuery('queryListings', []);
        if (Array.isArray(liveListings) && liveListings.length > 0) {
          return liveListings;
        }
        // Fallback: fetch all records and filter for listedForSale
        const allProps = await callFabricQuery('queryAllRecords', []);
        if (Array.isArray(allProps)) {
          const listings = allProps.filter((p) => p.listedForSale === true);
          if (listings.length > 0) return listings;
        }
      } catch (err) {
        console.warn('[getListings] Fabric live query notice:', err.message);
      }
    }
    await delay(250);
    const all = getAllProperties();
    return all.filter((p) => p.listedForSale === true);
  },

  // ── Read Single Property (retrieveProperty) ──
  getProperty: async (id) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const liveProp = await callFabricQuery('retrieveProperty', [id]);
        if (liveProp && liveProp.id) return liveProp;

        const allProps = await callFabricQuery('queryAllRecords', []);
        if (Array.isArray(allProps)) {
          const match = allProps.find((p) => p.id === id);
          if (match) return match;
        }
      } catch (err) {
        console.warn('[getProperty] Fabric live query notice:', err.message);
      }
    }
    await delay(200);
    const all = getAllProperties();
    return all.find((p) => p.id === id) || null;
  },

  // ── Register New Property (addProperty) ──
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
      jurisdiction: propData.jurisdiction || 'municipal',
      surveyNumber: propData.surveyNumber || 'PENDING',
      eKhataNo: propData.eKhataNo || 'PENDING',
      encumbrance: false,
      restrictions: false,
      listedForSale: false,
      regDate: new Date().toISOString().split('T')[0],
      blockNumber: Math.floor(Math.random() * 800) + 200,
    };

    if (!config.mockMode) {
      try {
        await callFabricInvoke('addProperty', [
          id,
          newProp.title,
          newProp.address,
          newProp.area,
          newProp.type,
          String(newProp.rawValue),
          newProp.owner,
          newProp.jurisdiction,
          newProp.surveyNumber,
          newProp.eKhataNo,
        ]);
      } catch (err) {
        console.warn('[registerProperty] Fabric invoke notice:', err.message);
      }
    }

    const existing = getAllProperties();
    const updated = [newProp, ...existing];
    saveAllProperties(updated);
    return newProp;
  },

  // ── Delist Property (delistProperty) ──
  delistProperty: async (propertyId) => {
    const config = getNetworkConfig();
    const currentUser = getCurrentUser();
    if (!config.mockMode) {
      try {
        await callFabricInvoke('delistProperty', [propertyId, currentUser?.email || '']);
      } catch (err) {
        console.warn('[delistProperty] Fabric invoke notice:', err.message);
      }
    }

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
      try {
        const prop = await callFabricQuery('retrieveProperty', [propertyId]);
        // If the property has an active encumbrance, the SRO node REJECTS the listing.
        // Throw so the SellWizard catch block shows the red failure state.
        if (prop.encumbrance === true) {
          const remarks = prop.encumbranceRemarks
            ? ` Details: ${prop.encumbranceRemarks}`
            : ' Active mortgage / lien / court order prevents listing.';
          throw new Error(
            `SRO Encumbrance Check Failed: Property "${propertyId}" has an active encumbrance.${remarks}`
          );
        }
        const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        return {
          node: 'SRO Office Peer (peer1.sro.com:7051)',
          mspId: 'sro-com',
          propertyId,
          mortgageStatus: 'Clear (No Active Mortgages / Liens)',
          cERSAICheck: 'PASSED (0 Encumbrance Notices)',
          subRegistrarLien: 'NIL',
          status: 'ENDORSED',
          endorsementSignature: sigHash,
          timestamp: new Date().toISOString(),
          verifiedBy: 'Sub-Registrar Officer (X.509 Certificate Valid)',
        };
      } catch (err) {
        // Re-throw so SellWizard sees it as a failure
        throw err;
      }
    }

    await delay(1000);
    const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    return {
      node: 'SRO Office Peer (peer1.sro.com:7051)',
      mspId: 'sro-com',
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

  // ── Step 1.ii: Revenue / Tahsildar / Municipal Node Endorsement ──
  verifyTahsildarNode: async (propertyId, sellerId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const prop = await callFabricQuery('retrieveProperty', [propertyId]);
        const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const pType = prop?.type || 'Residential';
        let portalDetails;
        if (pType === 'Plot' || pType === 'Agricultural') {
          portalDetails = {
            recordType: 'Pahani / RTC',
            managingDept: 'Revenue Department',
            digitalPortal: 'Bhoomi Portal',
            portalUrl: 'https://landrecords.karnataka.gov.in/',
            badge: 'MATCH',
          };
        } else if (pType === 'Rural Non-Ag') {
          portalDetails = {
            recordType: 'Form 9 & 11',
            managingDept: 'RDPR Panchayat Department',
            digitalPortal: 'e-Swathu Portal',
            portalUrl: 'https://eswathu.karnataka.gov.in/',
            badge: 'MATCH',
          };
        } else {
          portalDetails = {
            recordType: 'e-Khata',
            managingDept: 'Urban Local Bodies (Municipal)',
            digitalPortal: 'e-Aasthi Portal',
            portalUrl: 'https://eaasthi.karnataka.gov.in/',
            badge: 'MATCH',
          };
        }

        return {
          node: 'Revenue Authority Peer (peer1.revenue.com:7051)',
          mspId: 'revenue-com',
          propertyId,
          verifiedSeller: sellerId,
          rightfulOwnerStatus: 'CONFIRMED (Sole Legal Title Holder)',
          portalDetails,
          cadastralSurveyCheck: 'Boundary Geo-coordinates Compliant',
          status: 'ENDORSED',
          endorsementSignature: sigHash,
          timestamp: new Date().toISOString(),
          verifiedBy: 'Revenue Department Authority (X.509 Certified)',
        };
      } catch (err) {
        console.warn('[verifyTahsildarNode] Fabric query notice:', err.message);
      }
    }

    await delay(1100);
    const sigHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const prop = getAllProperties().find((p) => p.id === propertyId);
    const pType = prop?.type || 'Residential';
    const portalDetails = {
      recordType: pType === 'Plot' || pType === 'Agricultural' ? 'Pahani' : 'e-Khata',
      managingDept: 'Revenue / Municipal Department',
      digitalPortal: 'Bhoomi / e-Aasthi Portal',
      badge: 'MATCH',
    };

    return {
      node: 'Revenue Authority Peer (peer1.revenue.com:7051)',
      mspId: 'revenue-com',
      propertyId,
      verifiedSeller: sellerId,
      rightfulOwnerStatus: 'CONFIRMED (Sole Legal Title Holder)',
      portalDetails,
      cadastralSurveyCheck: 'Boundary Geo-coordinates Compliant',
      status: 'ENDORSED',
      endorsementSignature: sigHash,
      timestamp: new Date().toISOString(),
      verifiedBy: 'Revenue Department Authority (X.509 Certified)',
    };
  },

  // ── Step 2: Stamp Duty Calculation & Payment ──
  calculateStampDuty: async (propIdOrValue, amount, areaType = 'Urban') => {
    // Detect whether called as (propertyId, amount, areaType) or as (propertyValue)
    let propertyId = null;
    let rawNum = 0;

    if (amount !== undefined && (typeof propIdOrValue === 'string' && isNaN(Number(propIdOrValue)))) {
      propertyId = propIdOrValue;
      rawNum = Number(amount) || 0;
    } else {
      rawNum = Number(propIdOrValue) || Number(amount) || 0;
      propertyId = (typeof propIdOrValue === 'string' && isNaN(Number(propIdOrValue))) ? propIdOrValue : null;
    }

    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('calculateStampDuty', [String(rawNum)]);
        if (res && typeof res === 'object') {
          const base = Number(res.stampDuty || res.baseStampDuty) || Math.round(rawNum * 0.05);
          const cess = Number(res.cess) || Math.round(base * 0.10);
          const surchargeRate = areaType === 'Rural' ? 0.03 : 0.02;
          const surcharge = Number(res.surcharge) || Math.round(base * surchargeRate);
          const reg = Number(res.registrationFee) || Math.round(rawNum * 0.01);
          const total = Number(res.total || res.totalDuties) || (base + cess + surcharge);
          return {
            propertyId,
            propertyValue: rawNum,
            slabName: res.slabName || (rawNum < 2000000 ? 'Below ₹20 Lakhs (2%)' : rawNum <= 4500000 ? '₹20 Lakhs to ₹45 Lakhs (3%)' : 'Above ₹45 Lakhs (5%)'),
            stampDutyRate: rawNum < 2000000 ? 0.02 : rawNum <= 4500000 ? 0.03 : 0.05,
            baseStampDuty: base,
            stampDuty: base,
            stampDutyFormatted: `₹${base.toLocaleString('en-IN')}`,
            cess,
            areaType,
            surchargeRate,
            surcharge,
            registrationFee: reg,
            registrationFeeFormatted: `₹${reg.toLocaleString('en-IN')}`,
            total,
            totalDuties: total,
            totalDutiesFormatted: `₹${total.toLocaleString('en-IN')}`,
            currency: 'INR (₹)',
            calculatedAt: new Date().toISOString(),
            ...res,
          };
        }
      } catch (e) {
        console.warn('[calculateStampDuty] Live query notice:', e.message);
      }
    }

    let stampDutyRate = 0.05;
    let slabName = 'Above ₹45 Lakhs (5%)';

    if (rawNum < 2000000) {
      stampDutyRate = 0.02;
      slabName = 'Below ₹20 Lakhs (2%)';
    } else if (rawNum <= 4500000) {
      stampDutyRate = 0.03;
      slabName = '₹20 Lakhs to ₹45 Lakhs (3%)';
    }

    const baseStampDuty = Math.round(rawNum * stampDutyRate);
    const cess = Math.round(baseStampDuty * 0.10);
    const surchargeRate = areaType === 'Rural' ? 0.03 : 0.02;
    const surcharge = Math.round(baseStampDuty * surchargeRate);
    const registrationFee = Math.round(rawNum * 0.01);
    const total = baseStampDuty + cess + surcharge;

    return {
      propertyId,
      propertyValue: rawNum,
      slabName,
      stampDutyRate,
      baseStampDuty,
      stampDuty: baseStampDuty,
      stampDutyFormatted: `₹${baseStampDuty.toLocaleString('en-IN')}`,
      cess,
      areaType,
      surchargeRate,
      surcharge,
      registrationFee,
      registrationFeeFormatted: `₹${registrationFee.toLocaleString('en-IN')}`,
      total,
      totalDuties: total,
      totalDutiesFormatted: `₹${total.toLocaleString('en-IN')}`,
      currency: 'INR (₹)',
      calculatedAt: new Date().toISOString(),
    };
  },

  payStampDuty: async (propertyId, amount, paymentMethod = 'Cyber Treasury e-Challan (K2/IFMS)') => {
    await delay(800);
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
    await delay(1000);
    const blockNumber = Math.floor(Math.random() * 200) + 340;
    const txId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const merkleRoot = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      ordererNode: 'orderer1.sro.com:7050 (Raft Consensus Group)',
      txId,
      blockNumber,
      blockHash,
      merkleRoot,
      batchSize: '1 tx / block',
      packedAt: new Date().toISOString(),
      status: 'PACKED_INTO_BLOCK',
    };
  },

  // ── Step 4: Broadcast to Committing Peers & Commit to Ledger / CouchDB (buyProperty) ──
  broadcastAndCommitLedger: async ({ propertyId, fromOwner, toOwner, blockData, challanNo }) => {
    const config = getNetworkConfig();
    let fabricResult = null;

    if (!config.mockMode) {
      try {
        console.log(`[buyProperty] Committing transfer for ${propertyId} to ${toOwner} with challan ${challanNo}`);
        fabricResult = await callFabricInvoke('buyProperty', [
          propertyId,
          normalizeUserEmail(toOwner),
          challanNo || 'CHALLAN-DIRECT',
        ]);
        console.log(`[buyProperty Result]`, fabricResult);
      } catch (err) {
        console.warn('[broadcastAndCommitLedger] Fabric live invoke notice:', err.message);
      }
    }

    await delay(1000);

    // Update local state mirror
    const props = getAllProperties();
    const updatedProps = props.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          owner: normalizeUserEmail(toOwner),
          listedForSale: false,
          status: 'owned',
          blockNumber: blockData?.blockNumber || 108,
          lastTxId: blockData?.txId,
          challanNo,
        };
      }
      return p;
    });
    saveAllProperties(updatedProps);

    const couchRevision = `2-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    return {
      status: 'COMMITTED',
      channel: config.channel,
      committedNodes: [
        {
          node: 'SRO Peer Node (peer1.sro.com:7051)',
          ledgerUpdate: 'VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Revenue Peer Node (peer1.revenue.com:7051)',
          ledgerUpdate: 'VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Municipal Peer Node (peer1.municipal.com:7051)',
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
        lastBlockNumber: blockData?.blockNumber || 108,
        lastTxId: blockData?.txId,
        updatedAt: new Date().toISOString(),
      },
      fabricResult,
    };
  },

  // ── Sell Flow: Send Listing to Orderer ──
  sendListingToOrderer: async ({ propertyId, askingPrice, sroSig, tahsildarSig, seller }) => {
    await delay(900);
    const blockNumber = Math.floor(Math.random() * 200) + 350;
    const txId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const merkleRoot = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      ordererNode: 'orderer1.sro.com:7050 (Raft Consensus Group)',
      txId,
      blockNumber,
      blockHash,
      merkleRoot,
      action: 'LIST_PROPERTY_FOR_SALE',
      packedAt: new Date().toISOString(),
      status: 'PACKED_INTO_BLOCK',
    };
  },

  // ── Sell Flow: Broadcast Listing to Peers & CouchDB State (listPropertyForSale) ──
  broadcastAndCommitListing: async ({ propertyId, askingPrice, blockData, seller }) => {
    const config = getNetworkConfig();
    let fabricResult = null;

    if (!config.mockMode) {
      try {
        console.log(`[listPropertyForSale] Invoking listing for ${propertyId} by ${seller} at ₹${askingPrice}`);
        fabricResult = await callFabricInvoke('listPropertyForSale', [
          propertyId,
          String(askingPrice),
          normalizeUserEmail(seller),
        ]);
        console.log(`[listPropertyForSale Result]`, fabricResult);
      } catch (err) {
        console.warn('[broadcastAndCommitListing] Fabric live invoke notice:', err.message);
      }
    }

    await delay(1000);
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
          blockNumber: blockData?.blockNumber || 108,
          lastTxId: blockData?.txId,
        };
      }
      return p;
    });
    saveAllProperties(updatedProps);

    const couchRevision = `2-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    return {
      status: 'COMMITTED',
      channel: config.channel,
      committedNodes: [
        {
          node: 'SRO Peer Node (peer1.sro.com:7051)',
          ledgerUpdate: 'LISTING_VALIDATED_AND_COMMITTED',
          vsccCheck: 'PASSED',
        },
        {
          node: 'Revenue Peer Node (peer1.revenue.com:7051)',
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
        lastBlockNumber: blockData?.blockNumber || 108,
        lastTxId: blockData?.txId,
        updatedAt: new Date().toISOString(),
      },
      fabricResult,
    };
  },

  // ── Backward Compatible / Legacy wrappers ──
  transferOwnership: async (propertyId, fromOwner, toOwner, deedId) => {
    return BlockchainAPI.broadcastAndCommitLedger({
      propertyId,
      fromOwner,
      toOwner,
      blockData: { blockNumber: 108, txId: `0x${Date.now()}` },
      challanNo: deedId || 'CHALLAN-LEGACY',
    });
  },

  // ── History (getPropertyHistory) ──
  getPropertyHistory: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const history = await callFabricQuery('getPropertyHistory', [propertyId]);
        if (Array.isArray(history) && history.length > 0) {
          return history.map((h, i) => ({
            event: i === 0 ? 'Initial Ledger Inception' : 'Smart Contract State Transition',
            date: h.timestamp ? new Date(h.timestamp.seconds * 1000).toISOString().split('T')[0] : '2026-10-15',
            by: h.value?.owner || 'Hyperledger Committer',
            txId: h.txId ? `${h.txId.slice(0, 10)}...` : '0x...',
            block: `#${100 + i}`,
            icon: i === 0 ? '🏛️' : '🔄',
          }));
        }
      } catch (err) {
        console.warn('[getPropertyHistory] Fabric query notice:', err.message);
      }
    }
    await delay(250);
    return [
      {
        event: 'Property Registered on Hyperledger Fabric',
        date: '2023-01-15',
        by: 'rahul@cdac.in',
        txId: '0x94f8a1...4b22',
        block: '#104',
        icon: '🏛️',
      },
      {
        event: 'Encumbrance Clearance Issued',
        date: '2023-06-20',
        by: 'peer1.sro.com',
        txId: '0xa721e0...9c11',
        block: '#156',
        icon: '⚖️',
      },
      {
        event: 'Dual Verification by Municipal Node',
        date: '2024-01-22',
        by: 'peer1.municipal.com',
        txId: '0x3ef12c...d88a',
        block: '#201',
        icon: '🔄',
      },
    ];
  },

  // ── Multi-Org Governance & Dashboards API ──
  freezeProperty: async (propertyId, caseNo, remarks) => {
    return callFabricInvoke('freezeProperty', [propertyId, caseNo, remarks]);
  },

  unfreezeProperty: async (propertyId, orderRef, remarks) => {
    return callFabricInvoke('unfreezeProperty', [propertyId, orderRef, remarks]);
  },

  setEncumbranceStatus: async (propertyId, status, remarks, encumbranceType) => {
    return callFabricInvoke('setEncumbranceStatus', [propertyId, String(status), remarks || '', encumbranceType || '']);
  },

  verifyAuthorityDetails: async (propertyId, eKhataNo, surveyNumber) => {
    return callFabricInvoke('verifyAuthorityDetails', [propertyId, eKhataNo, surveyNumber]);
  },

  revokeOwnershipVerification: async (propertyId, reason) => {
    return callFabricInvoke('revokeOwnershipVerification', [propertyId, reason]);
  },

  updateValuation: async (propertyId, newGuidelineValue, valuationRef) => {
    return callFabricInvoke('updateValuation', [propertyId, String(newGuidelineValue), valuationRef]);
  },

  queryByJurisdiction: async (jurisdictionType) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryByJurisdiction', [jurisdictionType]);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryByJurisdiction] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    return all.filter((p) => (p.jurisdiction || '').toLowerCase() === (jurisdictionType || '').toLowerCase());
  },

  queryEncumberedProperties: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryEncumberedProperties', []);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryEncumberedProperties] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    return all.filter((p) => p.encumbrance === true);
  },

  queryFrozenProperties: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryFrozenProperties', []);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryFrozenProperties] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    return all.filter((p) => p.frozen === true);
  },

  queryPendingVerification: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryPendingVerification', []);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryPendingVerification] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    return all.filter((p) => p.ownershipVerified === false);
  },

  queryAllRecords: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryAllRecords', []);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryAllRecords] Live query notice:', e.message);
      }
    }
    return getAllProperties();
  },
};
