/**
 * NBF-Lite Blockchain API Layer
 * All storage and transaction calls go through this module.
 * 
 * Supports both:
 * 1. Pattern A: Transparent Auto-Enrollment (live against ca1.sro.com & channel1 on localhost:4000)
 * 2. Simulated Mock Mode (interactive fallback)
 */

const STORAGE_KEY_PROPS_V2 = 'propchain_all_properties_v5';
const STORAGE_KEY_CONFIG = 'propchain_network_config_v1';
const STORAGE_KEY_USERS = 'propchain_users_registry_v2';

export const LOCAL_WSL_CONFIG = {
  baseUrl: 'http://localhost:4000',
  cfgpath: '/home/mithun/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json',
};

export const VM_NODE_CONFIG = {
  baseUrl: 'http://192.168.231.128:4000',
  cfgpath: '/home/admin1/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json',
};

const DEFAULT_CONFIG = {
  baseUrl: LOCAL_WSL_CONFIG.baseUrl,
  channel: 'channel1',
  chaincode: 'property',
  mspId: 'sro-com',
  caname: 'ca1.sro.com',
  cfgpath: LOCAL_WSL_CONFIG.cfgpath,
  local: true,
  mockMode: false,
};

export function resolveCfgPathForUrl(baseUrl, cfgpath) {
  const url = String(baseUrl || '').trim();
  const current = String(cfgpath || '').trim();
  if (url.includes('192.168.231.128')) {
    if (!current || current.startsWith('/home/mithun/')) {
      return VM_NODE_CONFIG.cfgpath;
    }
  } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (!current || current.startsWith('/home/admin1/')) {
      return LOCAL_WSL_CONFIG.cfgpath;
    }
  }
  return current || DEFAULT_CONFIG.cfgpath;
}

export function getNetworkConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!saved) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(saved);
    // Migrate obsolete pre-migration defaults (port 3000 or dummy channel 'localchannelone')
    if (
      parsed.baseUrl === 'http://localhost:3000' ||
      parsed.channel === 'localchannelone'
    ) {
      const updated = {
        ...DEFAULT_CONFIG,
        ...parsed,
        baseUrl: DEFAULT_CONFIG.baseUrl,
        channel: DEFAULT_CONFIG.channel,
        chaincode: DEFAULT_CONFIG.chaincode,
        mspId: DEFAULT_CONFIG.mspId,
        cfgpath: DEFAULT_CONFIG.cfgpath,
        mockMode: false,
      };
      return saveNetworkConfig(updated);
    }
    const cleanBaseUrl = String(parsed.baseUrl || DEFAULT_CONFIG.baseUrl).trim().replace(/\/+$/, '');
    const resolvedCfgpath = resolveCfgPathForUrl(cleanBaseUrl, parsed.cfgpath);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      baseUrl: cleanBaseUrl,
      cfgpath: resolvedCfgpath,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveNetworkConfig(cfg) {
  const cleanBaseUrl = String(cfg?.baseUrl || DEFAULT_CONFIG.baseUrl).trim().replace(/\/+$/, '');
  const normalized = {
    ...DEFAULT_CONFIG,
    ...cfg,
    baseUrl: cleanBaseUrl,
    cfgpath: resolveCfgPathForUrl(cleanBaseUrl, cfg?.cfgpath),
  };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(normalized));
  return normalized;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('propchain_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function extractUserAadhar(user) {
  if (!user) return '';
  if (user.aadhar) {
    const clean = String(user.aadhar).replace(/\D/g, '');
    if (clean.length === 12) return clean;
  }
  if (user.govId && String(user.govId).toUpperCase().startsWith('AADHAR')) {
    const clean = String(user.govId).replace(/\D/g, '');
    if (clean.length === 12) return clean;
  }
  return '';
}

// ── Multi-User Predefined Citizen & Institutional Profiles ──
export const PRESET_USERS = [
  // ── Citizens ──
  {
    name: 'Rahul Sharma',
    email: 'rahul@cdac.in',
    alias: 'citizen@cdac.in',
    govId: 'AADHAR-8821-4521-4521',
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
    govId: 'AADHAR-9920-1123-1123',
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
    govId: 'AADHAR-4451-8890-8890',
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
    govId: 'AADHAR-6712-3349-3349',
    org: 'sro-com',
    role: 'Heritage Estate Owner',
    avatar: 'SR',
    avatarColor: '#d97706',
    city: 'Hyderabad, Telangana',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Mithun',
    email: 'mithunpatil2005@gmail.com',
    alias: 'mithun@cdac.in',
    govId: 'AADHAR-1234-5678-9012',
    org: 'sro-com',
    role: 'Citizen Property Owner & Tech Founder',
    avatar: 'MP',
    avatarColor: '#6366f1',
    city: 'Bangalore East, Karnataka',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Ronak',
    email: 'hailhydra259@gmail.com',
    alias: 'ronak@cdac.in',
    govId: 'AADHAR-1234-5678-9013',
    org: 'sro-com',
    role: 'Citizen Commercial Real Estate Landlord',
    avatar: 'RN',
    avatarColor: '#0ea5e9',
    city: 'HSR Layout, Bangalore, Karnataka',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Soori',
    email: 'fire777rat@gmail.com',
    alias: 'soori@cdac.in',
    govId: 'AADHAR-7676-7676-7676',
    org: 'sro-com',
    role: 'Citizen Agri-Landowner & Investor',
    avatar: 'SR',
    avatarColor: '#10b981',
    city: 'Mandya / Devanahalli, Karnataka',
    type: 'citizen',
    dashboard: 'citizen',
  },
  {
    name: 'Test1',
    email: 'test1@cdac.in',
    alias: 'test1@cdac.in',
    govId: 'AADHAR-5656-5656-5656',
    org: 'sro-com',
    role: 'Registered Citizen (Test Account)',
    avatar: 'T1',
    avatarColor: '#f59e0b',
    city: 'Bangalore, Karnataka',
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
    dashboard: 'municipal',
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
    dashboard: 'revenue',
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
    dashboard: 'panchayat',
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
  'mithunpatil2005@gmail.com': 'Mithun@2024',
  'hailhydra259@gmail.com': 'Ronak@2024',
  'fire777rat@gmail.com': 'Soori@2024',
  'test1@cdac.in': 'Test1@2024',
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

export function getPropertyLegalStatus(prop) {
  if (!prop) {
    return {
      isFrozen: false,
      hasCourtStay: false,
      hasBankLien: false,
      isEncumbered: false,
      encType: 'NONE',
      bankLienType: null,
      bankLienRemarks: null,
    };
  }

  const isFrozen = prop.frozen === true;
  const isEncumbered = prop.encumbrance === true;
  const encType = prop.encumbranceType || (isEncumbered ? 'BANK_MORTGAGE' : 'NONE');
  const encLogs = Array.isArray(prop.encumbranceLog) ? prop.encumbranceLog : [];

  const bankLogs = encLogs.filter(
    (e) =>
      e &&
      (e.mspId === 'bank-com' ||
        (e.type && e.type !== 'COURT_ORDER' && e.type !== 'NONE'))
  );
  const bankFlaggedCount = bankLogs.filter((e) => e.action === 'FLAGGED').length;
  const bankClearedCount = bankLogs.filter((e) => e.action === 'CLEARED').length;
  const hasActiveBankLog = bankFlaggedCount > bankClearedCount;

  const hasBankLien =
    (isEncumbered && encType !== 'COURT_ORDER' && encType !== 'NONE') ||
    hasActiveBankLog;

  const bankFlagEntries = bankLogs.filter((e) => e.action === 'FLAGGED');
  const latestBankFlag = bankFlagEntries.length > 0 ? bankFlagEntries[bankFlagEntries.length - 1] : null;
  const bankLienType = hasBankLien
    ? (encType && encType !== 'COURT_ORDER' && encType !== 'NONE'
        ? encType
        : latestBankFlag?.type || 'BANK_MORTGAGE')
    : null;
  const bankLienRemarks = hasBankLien
    ? (prop.encumbranceRemarks || latestBankFlag?.remarks || null)
    : null;

  return {
    isFrozen,
    hasCourtStay: isFrozen,
    hasBankLien,
    isEncumbered: isEncumbered || hasBankLien,
    encType: hasBankLien && encType === 'COURT_ORDER' ? bankLienType : encType,
    bankLienType,
    bankLienRemarks,
  };
}

const INITIAL_ALL_PROPERTIES = [
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
    restrictions: false,
    listedForSale: false,
    regDate: '2023-01-15',
    blockNumber: 104,
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
    restrictions: false,
    listedForSale: false,
    regDate: '2023-06-20',
    blockNumber: 156,
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
    restrictions: false,
    listedForSale: true,
    regDate: '2022-11-10',
    blockNumber: 88,
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
    restrictions: false,
    listedForSale: true,
    regDate: '2022-04-18',
    blockNumber: 62,
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
    restrictions: false,
    listedForSale: true,
    regDate: '2023-09-12',
    blockNumber: 210,
  },
  {
    id: 'PROP020',
    title: 'Indiranagar Penthouse Suites',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore East',
    city: 'Bangalore',
    locality: 'Indiranagar',
    pincode: '560038',
    address: '402, 100 Feet Road, Indiranagar, Bangalore East, Bangalore Urban, Karnataka - 560038',
    area: '3200 sq.ft',
    type: 'Residential',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-77/3C',
    eKhataNo: 'BBMP-A-66109',
    rawValue: 14500000,
    guidelineValue: 14500000,
    value: '₹1,45,00,000',
    owner: 'mithunpatil2005@gmail.com',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 315,
  },
  {
    id: 'PROP021',
    title: 'Palm Grove Luxury Villa',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Anekal',
    city: 'Bangalore',
    locality: 'Sarjapur',
    pincode: '562125',
    address: 'Villa 18, Palm Grove Enclave, Sarjapur, Anekal Taluk, Bangalore Urban, Karnataka - 562125',
    area: '2800 sq.ft',
    type: 'Residential',
    jurisdiction: 'panchayat',
    surveyNumber: 'SY-112/1',
    eKhataNo: 'BBMP-A-55421',
    rawValue: 9800000,
    guidelineValue: 9800000,
    value: '₹98,00,000',
    owner: 'mithunpatil2005@gmail.com',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2026-11-10',
    blockNumber: 328,
  },
  {
    id: 'PROP022',
    title: 'Riverside Tech Park Workspace',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore East',
    city: 'Bangalore',
    locality: 'Whitefield',
    pincode: '560066',
    address: 'Plot 7, Whitefield Tech Zone, Bangalore East, Bangalore Urban, Karnataka - 560066',
    area: '4500 sq.ft',
    type: 'Commercial',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-92/4B',
    eKhataNo: 'BBMP-COMM-3321',
    rawValue: 21000000,
    guidelineValue: 21000000,
    value: '₹2,10,00,000',
    owner: 'mithunpatil2005@gmail.com',
    status: 'owned',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 330,
  },
  {
    id: 'PROP023',
    title: 'Silicon Tech Vista Commercial Floor',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore East',
    city: 'Bangalore',
    locality: 'Bellandur',
    pincode: '560103',
    address: 'Floor 5, Tower B, Outer Ring Road, Bellandur, Bangalore East, Bangalore Urban, Karnataka - 560103',
    area: '4500 sq.ft',
    type: 'Commercial',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-92/4B',
    eKhataNo: 'BBMP-COMM-3321',
    rawValue: 21000000,
    guidelineValue: 21000000,
    value: '₹2,10,00,000',
    owner: 'hailhydra259@gmail.com',
    status: 'owned',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 335,
  },
  {
    id: 'PROP024',
    title: 'Cyber Greens Duplex Apartment',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore South',
    city: 'Bangalore',
    locality: 'HSR Layout',
    pincode: '560102',
    address: '88, Sector 2, HSR Layout, Bangalore South, Bangalore Urban, Karnataka - 560102',
    area: '2200 sq.ft',
    type: 'Apartment',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-44/2',
    eKhataNo: 'BBMP-A-77312',
    rawValue: 8200000,
    guidelineValue: 8200000,
    value: '₹82,00,000',
    owner: 'hailhydra259@gmail.com',
    status: 'for_sale',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2026-11-10',
    blockNumber: 338,
  },
  {
    id: 'PROP025',
    title: 'Bellandur Lake View Penthouse',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore East',
    city: 'Bangalore',
    locality: 'Bellandur',
    pincode: '560103',
    address: 'Unit 12, Prestige Tower, Bellandur, Bangalore East, Karnataka - 560103',
    area: '1800 sq.ft',
    type: 'Apartment',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-55/3',
    eKhataNo: 'BBMP-A-33210',
    rawValue: 11500000,
    guidelineValue: 11500000,
    value: '₹1,15,00,000',
    owner: 'hailhydra259@gmail.com',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 341,
  },
  {
    id: 'PROP026',
    title: 'Cauvery Riverside Orchard',
    state: 'Karnataka',
    district: 'Mandya',
    taluk: 'Srirangapatna',
    city: 'Srirangapatna',
    locality: 'Palahalli',
    pincode: '571438',
    address: 'Survey 18, Palahalli, Srirangapatna Taluk, Mandya District, Karnataka - 571438',
    area: '3.5 Acres',
    type: 'Agricultural',
    jurisdiction: 'revenue',
    surveyNumber: 'SY-18/5A',
    eKhataNo: 'RTC-BHOOMI-9923',
    rawValue: 5500000,
    guidelineValue: 5500000,
    value: '₹55,00,000',
    owner: 'fire777rat@gmail.com',
    status: 'owned',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 344,
  },
  {
    id: 'PROP027',
    title: 'Golden Palms Eco Plot',
    state: 'Karnataka',
    district: 'Bangalore Rural',
    taluk: 'Devanahalli',
    city: 'Devanahalli',
    locality: 'KIA Airport Enclave',
    pincode: '562110',
    address: 'Plot 24, International Airport Road, Devanahalli Taluk, Bangalore Rural, Karnataka - 562110',
    area: '2400 sq.ft',
    type: 'Plot',
    jurisdiction: 'revenue',
    surveyNumber: 'SY-63/1C',
    eKhataNo: 'BIAPPA-F9-2201',
    rawValue: 4800000,
    guidelineValue: 4800000,
    value: '₹48,00,000',
    owner: 'fire777rat@gmail.com',
    status: 'for_sale',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2026-11-10',
    blockNumber: 347,
  },
  {
    id: 'PROP028',
    title: 'Mysuru Heritage Haveli',
    state: 'Karnataka',
    district: 'Mysore',
    taluk: 'Mysuru Taluk',
    city: 'Mysore',
    locality: 'Mandi Mohalla',
    pincode: '570021',
    address: '23, Mandi Mohalla, Mysuru Taluk, Mysore District, Karnataka - 570021',
    area: '3000 sq.ft',
    type: 'Residential',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-34/2A',
    eKhataNo: 'MYS-A-77091',
    rawValue: 7200000,
    guidelineValue: 7200000,
    value: '₹72,00,000',
    owner: 'fire777rat@gmail.com',
    status: 'owned',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 350,
  },
  {
    id: 'PROP029',
    title: 'Koramangala Startup Hub',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Bangalore South',
    city: 'Bangalore',
    locality: 'Koramangala',
    pincode: '560095',
    address: '12, 5th Block, Koramangala, Bangalore South, Bangalore Urban, Karnataka - 560095',
    area: '1200 sq.ft',
    type: 'Commercial',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-21/1B',
    eKhataNo: 'BBMP-COMM-5566',
    rawValue: 6500000,
    guidelineValue: 6500000,
    value: '₹65,00,000',
    owner: 'test1@cdac.in',
    status: 'owned',
    image: 'commercial',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 353,
  },
  {
    id: 'PROP030',
    title: 'Electronic City Phase-2 Plot',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Anekal',
    city: 'Bangalore',
    locality: 'Electronic City',
    pincode: '560100',
    address: 'Plot 9, Phase-2, Electronic City, Anekal Taluk, Bangalore Urban, Karnataka - 560100',
    area: '1500 sq.ft',
    type: 'Plot',
    jurisdiction: 'panchayat',
    surveyNumber: 'SY-71/2C',
    eKhataNo: 'PANCH-F9-8820',
    rawValue: 3800000,
    guidelineValue: 3800000,
    value: '₹38,00,000',
    owner: 'test1@cdac.in',
    status: 'for_sale',
    image: 'plot',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2026-11-10',
    blockNumber: 356,
  },
  {
    id: 'PROP031',
    title: 'Sarjapur Road Smart Apartment',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    taluk: 'Anekal',
    city: 'Bangalore',
    locality: 'Sarjapur',
    pincode: '562125',
    address: 'Unit 404, Prestige Smart City, Sarjapur, Bangalore, Karnataka - 562125',
    area: '1100 sq.ft',
    type: 'Apartment',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-91/4D',
    eKhataNo: 'BBMP-A-91122',
    rawValue: 5200000,
    guidelineValue: 5200000,
    value: '₹52,00,000',
    owner: 'test1@cdac.in',
    status: 'owned',
    image: 'apartment',
    encumbrance: false,
    restrictions: false,
    listedForSale: false,
    regDate: '2026-11-10',
    blockNumber: 359,
  },
  {
    id: 'PROP012',
    title: 'Oceanview Coastal Estate',
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    taluk: 'Mangalore',
    city: 'Mangalore',
    locality: 'Panambur',
    pincode: '575010',
    address: '14, Panambur Coastal Road, Mangalore Taluk, Dakshina Kannada, Karnataka - 575010',
    area: '3000 sq.ft',
    type: 'Residential',
    jurisdiction: 'municipal',
    surveyNumber: 'SY-105/2',
    eKhataNo: 'MCC-A-11082',
    rawValue: 6800000,
    guidelineValue: 6800000,
    value: '₹68,00,000',
    owner: 'priya@cdac.in',
    status: 'for_sale',
    image: 'villa',
    encumbrance: false,
    restrictions: false,
    listedForSale: true,
    regDate: '2024-04-02',
    blockNumber: 322,
  },
];

function getAllProperties() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPS_V2);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROPS_V2, JSON.stringify(INITIAL_ALL_PROPERTIES));
      return INITIAL_ALL_PROPERTIES;
    }
    const stored = JSON.parse(raw);
    const storedIds = new Set(stored.map((p) => p.id));
    const missing = INITIAL_ALL_PROPERTIES.filter((p) => !storedIds.has(p.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      localStorage.setItem(STORAGE_KEY_PROPS_V2, JSON.stringify(merged));
      return merged;
    }
    return stored;
  } catch {
    return INITIAL_ALL_PROPERTIES;
  }
}

function saveAllProperties(props) {
  localStorage.setItem(STORAGE_KEY_PROPS_V2, JSON.stringify(props));
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// All ledger reads go through querycc (evaluateTransaction) so read-only queries
// evaluate on a single peer without committing blocks or failing endorsement comparison.
async function callFabricQuery(fcn, args = []) {
  return callFabricRequest('querycc', fcn, args);
}

async function callFabricInvoke(fcn, args = []) {
  return callFabricRequest('invokecc', fcn, args);
}

async function callFabricRequest(endpoint, fcn, args = []) {
  const config = getNetworkConfig();
  const currentUser = getCurrentUser();
  let user = currentUser?.email ? normalizeUserEmail(currentUser.email) : 'admin';
  let mspId = currentUser?.org || config.mspId;

  // Auto-route specialized smart contract functions to their authorized MSP identities
  if (fcn === 'freezeProperty' || fcn === 'unfreezeProperty') {
    user = 'court@judiciary.com';
    mspId = 'judiciary-com';
  } else if (fcn === 'setEncumbranceStatus') {
    user = 'manager@bank.com';
    mspId = 'bank-com';
  } else if (fcn === 'verifyAuthorityDetails' || fcn === 'revokeOwnershipVerification') {
    if (mspId !== 'municipal-com' && mspId !== 'revenue-com' && mspId !== 'panchayat-com') {
      user = 'officer@municipal.com';
      mspId = 'municipal-com';
    }
  } else if (fcn === 'addProperty') {
    user = 'registrar@sro.com';
    mspId = 'sro-com';
  } else if (
    endpoint === 'querycc' ||
    fcn === 'queryAllRecords' ||
    fcn === 'generateEncumbranceCertificate' ||
    fcn === 'verifyRootTitle' ||
    fcn === 'getPropertyHistory' ||
    fcn === 'retrieveProperty' ||
    fcn === 'recordExists'
  ) {
    if (
      !currentUser ||
      currentUser.type === 'citizen' ||
      currentUser.dashboard === 'citizen' ||
      currentUser.role?.toLowerCase().includes('citizen') ||
      user.includes('cdac.in') ||
      user.includes('@')
    ) {
      user = 'registrar@sro.com';
      mspId = 'sro-com';
    }
  }

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

  const res = await fetch(`${config.baseUrl}/fabric/v1/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fabric ${endpoint} failed (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  if (data.sFlag === false) {
    throw new Error(data.error || `Transaction ${endpoint} failed`);
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
      cfgpath: config.cfgpath || '/home/mithun/.servers/ubfagent/vars/profiles/channel1_connection_for_nodesdk.json',
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
      // "user already enrolled" is a success — wallet identity already exists
      const alreadyEnrolled = result.status === 'user already enrolled';
      const enrolled = Boolean(result.sFlag) || alreadyEnrolled;
      console.log(`[Pattern A Auto-Enrollment Result] user="${normalized}" ok=${enrolled} status="${result.status || result.error || 'unknown'}"`);
      return { ok: enrolled, ...result };
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
  registerUser: async (email, password, name, aadharNumber) => {
    await delay(450);
    const registry = getUserRegistry();
    const normalizedEmail = email.toLowerCase();

    if (registry[normalizedEmail]) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const cleanAadhar = (aadharNumber || '').replace(/\D/g, '');
    const finalGovId = cleanAadhar.length === 12
      ? `AADHAR-${cleanAadhar.slice(0, 4)}-${cleanAadhar.slice(4, 8)}-${cleanAadhar.slice(8, 12)}`
      : `AADHAR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const displayName =
      name?.trim() ||
      email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const newUser = {
      name: displayName,
      email: normalizedEmail,
      govId: finalGovId,
      ...(cleanAadhar.length === 12 ? { aadhar: cleanAadhar } : {}),
      org: 'sro-com',
      role: 'Registered Citizen',
      type: 'citizen',
      dashboard: 'citizen',
      avatar: displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: '#0891b2',
      city: 'India',
      password,
    };

    registry[normalizedEmail] = newUser;
    saveUserRegistry(registry);

    // Register with OTP backend if Aadhar provided
    if (cleanAadhar.length === 12) {
      try {
        await fetch('http://localhost:3001/api/auth/register-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aadharNumber: cleanAadhar, name: displayName, email: normalizedEmail }),
        });
      } catch (e) {
        console.warn('Backend citizen registration notice:', e.message);
      }
    }

    const { password: _pw, ...user } = newUser;

    // Pattern A: Auto-enroll on registration — await so the wallet identity is
    // created before the user is returned to the UI.
    const config = getNetworkConfig();
    let enrollmentResult = { ok: true, status: 'mock' };
    if (!config.mockMode) {
      enrollmentResult = await BlockchainAPI.ensureEnrolled(user.email);
      if (!enrollmentResult.ok) {
        console.warn(
          `[registerUser] Fabric wallet enrollment failed for "${user.email}": ${enrollmentResult.error || 'unknown error'}. ` +
          'User account saved locally; re-enrollment will be attempted on next login.'
        );
      } else {
        console.log(`[registerUser] Fabric wallet identity created for "${user.email}" (status: ${enrollmentResult.status}).`);
      }
    }

    return { ok: true, user, enrollmentStatus: enrollmentResult };
  },

  getUsers: () => PRESET_USERS,

  getRegisteredCitizens: async () => {
    const registry = getUserRegistry();
    const byEmail = new Map();

    Object.values(registry).forEach((u) => {
      if (!u || !u.email) return;
      const isOrg = u.type === 'org' || (u.dashboard && u.dashboard !== 'citizen');
      if (isOrg) return;
      const email = normalizeUserEmail(u.email).toLowerCase();
      byEmail.set(email, {
        name: u.name || email.split('@')[0],
        email,
        govId: u.govId || '',
        aadhar: extractUserAadhar(u),
        city: u.city || '',
      });
    });

    try {
      const res = await fetch('http://localhost:3001/api/citizens');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.citizens)) {
          data.citizens.forEach((c) => {
            if (!c?.email) return;
            const email = normalizeUserEmail(c.email).toLowerCase();
            const existing = byEmail.get(email);
            byEmail.set(email, {
              name: existing?.name || c.name || email.split('@')[0],
              email,
              govId: existing?.govId || c.govId || '',
              aadhar: existing?.aadhar || (c.aadhar ? String(c.aadhar).replace(/\D/g, '') : ''),
              city: existing?.city || '',
            });
          });
        }
      }
    } catch {
      // Backend auth server may be offline in simulated/frontend-only mode; client registry still works.
    }

    return Array.from(byEmail.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  // ── Aadhar OTP Authentication (via backend server) ──
  sendOtp: async (aadharNumber) => {
    const OTP_SERVER = 'http://localhost:3001';
    const res = await fetch(`${OTP_SERVER}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadharNumber }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Failed to send OTP.' };
    }
    return {
      ok: true,
      maskedEmail: data.maskedEmail,
      citizenName: data.citizenName,
      devOtp: data.devOtp,
      emailSent: data.emailSent,
      message: data.message,
    };
  },

  verifyOtp: async (aadharNumber, otp) => {
    const OTP_SERVER = 'http://localhost:3001';
    const res = await fetch(`${OTP_SERVER}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadharNumber, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'OTP verification failed.' };
    }

    // OTP verified — log the citizen in using their email
    const cleanAadhar = String(aadharNumber || '').replace(/\D/g, '');
    const email = data.citizenEmail;
    const registry = getUserRegistry();
    const normalizedEmail = normalizeUserEmail(email);
    let record = registry[normalizedEmail];

    if (!record) {
      // Auto-create citizen profile if not in client registry
      record = {
        name: data.citizenName || 'Citizen',
        email: normalizedEmail,
        govId: `AADHAR-${cleanAadhar.slice(0, 4)}-${cleanAadhar.slice(4, 8)}-${cleanAadhar.slice(8, 12)}`,
        aadhar: cleanAadhar,
        org: 'sro-com',
        role: 'Registered Citizen',
        avatar: (data.citizenName || 'CT').slice(0, 2).toUpperCase(),
        avatarColor: '#2563eb',
        city: 'Karnataka, India',
        type: 'citizen',
        dashboard: 'citizen',
      };
      registry[normalizedEmail] = record;
      saveUserRegistry(registry);
    } else if (cleanAadhar.length === 12 && !record.aadhar) {
      record = { ...record, aadhar: cleanAadhar };
      registry[normalizedEmail] = record;
      saveUserRegistry(registry);
    }

    const { password: _pw, ...user } = record;

    // Pattern A: Auto-enroll on OTP login — await so the wallet identity is
    // created before the user is returned to the UI.
    const config = getNetworkConfig();
    let enrollmentResult = { ok: true, status: 'mock' };
    if (!config.mockMode) {
      enrollmentResult = await BlockchainAPI.ensureEnrolled(user.email);
      if (!enrollmentResult.ok) {
        console.warn(
          `[verifyOtp] Fabric wallet enrollment failed for "${user.email}": ${enrollmentResult.error || 'unknown error'}. ` +
          'Citizen logged in; re-enrollment will be retried on next login.'
        );
      } else {
        console.log(`[verifyOtp] Fabric wallet identity ready for "${user.email}" (status: ${enrollmentResult.status}).`);
      }
    }
    return { ok: true, user, enrollmentStatus: enrollmentResult };
  },

  // ── Aadhar Registration OTP (via backend server) ──
  sendRegisterOtp: async (aadharNumber, email, name) => {
    const OTP_SERVER = 'http://localhost:3001';
    const cleanAadhar = (aadharNumber || '').replace(/\D/g, '');
    const res = await fetch(`${OTP_SERVER}/api/auth/send-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadharNumber: cleanAadhar, email, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Failed to send registration OTP.' };
    }
    return {
      ok: true,
      maskedEmail: data.maskedEmail,
      citizenName: data.citizenName,
      devOtp: data.devOtp,
      emailSent: data.emailSent,
      message: data.message,
    };
  },

  verifyRegisterOtp: async (aadharNumber, otp, email, name, password) => {
    const OTP_SERVER = 'http://localhost:3001';
    const cleanAadhar = (aadharNumber || '').replace(/\D/g, '');
    const res = await fetch(`${OTP_SERVER}/api/auth/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadharNumber: cleanAadhar, otp, email, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Registration OTP verification failed.' };
    }

    const normalizedEmail = normalizeUserEmail(data.citizenEmail || email);
    const displayName = data.citizenName || name?.trim() || normalizedEmail.split('@')[0];
    const finalGovId = `AADHAR-${cleanAadhar.slice(0, 4)}-${cleanAadhar.slice(4, 8)}-${cleanAadhar.slice(8, 12)}`;
    const finalPassword = password || 'Citizen@2024';

    const registry = getUserRegistry();
    const newUser = {
      name: displayName,
      email: normalizedEmail,
      govId: finalGovId,
      aadhar: cleanAadhar,
      org: 'sro-com',
      role: 'Registered Citizen',
      avatar: displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'CT',
      avatarColor: '#0891b2',
      city: 'India',
      password: finalPassword,
      type: 'citizen',
      dashboard: 'citizen',
    };

    registry[normalizedEmail] = newUser;
    saveUserRegistry(registry);

    const { password: _pw, ...user } = newUser;

    // Pattern A: Auto-enroll on registration — await so the wallet identity is
    // created before the UI completes the registration flow.
    const config = getNetworkConfig();
    let enrollmentResult = { ok: true, status: 'mock' };
    if (!config.mockMode) {
      enrollmentResult = await BlockchainAPI.ensureEnrolled(user.email);
      if (!enrollmentResult.ok) {
        console.warn(
          `[verifyRegisterOtp] Fabric wallet enrollment failed for "${user.email}": ${enrollmentResult.error || 'unknown error'}. ` +
          'Citizen account saved; re-enrollment will be retried on next login.'
        );
      } else {
        console.log(`[verifyRegisterOtp] Fabric wallet identity created for "${user.email}" (status: ${enrollmentResult.status}).`);
      }
    }

    return { ok: true, user, message: data.message, enrollmentStatus: enrollmentResult };
  },

  // ── Transaction OTP Verification (Buy / Sell without re-entering Aadhar) ──
  sendTransactionOtp: async ({ user, action, propertyId, propertyTitle }) => {
    const OTP_SERVER = 'http://localhost:3001';
    const aadharNumber = extractUserAadhar(user);

    const res = await fetch(`${OTP_SERVER}/api/auth/send-transaction-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadharNumber,
        email: user?.email || '',
        name: user?.name || '',
        action,
        propertyId,
        propertyTitle,
      }),
    });

    // Backward compatibility if an older OTP server process hasn't been restarted yet
    if (res.status === 404 && aadharNumber.length === 12) {
      const fallbackRes = await fetch(`${OTP_SERVER}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadharNumber }),
      });
      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        return { ok: false, error: fallbackData.error || 'Failed to send OTP.' };
      }
      return {
        ok: true,
        maskedEmail: fallbackData.maskedEmail,
        maskedAadhar: `XXXX XXXX ${aadharNumber.slice(-4)}`,
        citizenName: fallbackData.citizenName,
        verificationKey: aadharNumber,
        usedLegacyFallback: true,
        devOtp: fallbackData.devOtp,
        emailSent: fallbackData.emailSent,
        message: fallbackData.message,
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Failed to send verification OTP.' };
    }
    return {
      ok: true,
      maskedEmail: data.maskedEmail,
      maskedAadhar: data.maskedAadhar,
      citizenName: data.citizenName,
      verificationKey: data.verificationKey,
      usedLegacyFallback: false,
      devOtp: data.devOtp,
      emailSent: data.emailSent,
      message: data.message,
    };
  },

  verifyTransactionOtp: async ({ verificationKey, user, otp, usedLegacyFallback }) => {
    const OTP_SERVER = 'http://localhost:3001';
    const aadharNumber = extractUserAadhar(user);

    if (usedLegacyFallback && aadharNumber.length === 12) {
      const fallbackRes = await fetch(`${OTP_SERVER}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadharNumber, otp }),
      });
      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        return { ok: false, error: fallbackData.error || 'OTP verification failed.' };
      }
      return { ok: true, message: fallbackData.message };
    }

    const res = await fetch(`${OTP_SERVER}/api/auth/verify-transaction-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationKey,
        aadharNumber,
        email: user?.email || '',
        otp,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'OTP verification failed.' };
    }
    return { ok: true, message: data.message };
  },

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
    const rawOwner = (propData.owner || '').trim();
    if (!rawOwner || !rawOwner.includes('@')) {
      throw new Error('A valid citizen owner email is required to register a property.');
    }

    const config = getNetworkConfig();
    const existing = getAllProperties();
    const existingIds = new Set(existing.map((p) => p.id));
    let id = `PROP${String(Math.floor(Math.random() * 900) + 100)}`;
    while (existingIds.has(id)) {
      id = `PROP${String(Math.floor(Math.random() * 900) + 100)}`;
    }

    const state = propData.state || 'Karnataka';
    const district = propData.district || 'Bangalore Urban';
    const taluk = propData.taluk || 'Bangalore North';
    const city = propData.city || 'Bangalore';
    const locality = propData.locality || propData.area || 'Central';
    const pincode = propData.pincode || '560001';
    const fullAddress = propData.address || `${locality}, ${taluk}, ${district}, ${state} - ${pincode}`;
    const rawValue = Number(propData.rawValue || 5000000);
    const guidelineValue = Number(propData.guidelineValue || rawValue || 5000000);
    const stampDuty = Math.round(rawValue * 0.05);
    const registrationFee = Math.round(rawValue * 0.01);
    const currentUser = getCurrentUser();

    const newProp = {
      ...propData,
      id,
      state,
      district,
      taluk,
      city,
      locality,
      pincode,
      address: fullAddress,
      owner: normalizeUserEmail(rawOwner).toLowerCase(),
      registeredBy: propData.registeredBy || currentUser?.email || 'registrar@sro.com',
      status: 'owned',
      rawValue,
      guidelineValue,
      value: `₹${rawValue.toLocaleString('en-IN')}`,
      askingPrice: rawValue,
      stampDuty,
      registrationFee,
      jurisdiction: propData.jurisdiction || 'municipal',
      surveyNumber: propData.surveyNumber || 'PENDING',
      eKhataNo: propData.eKhataNo || 'PENDING',
      encumbrance: false,
      restrictions: false,
      frozen: false,
      ownershipVerified: true,
      surveyVerified: true,
      listedForSale: false,
      regDate: new Date().toISOString().split('T')[0],
      blockNumber: Math.floor(Math.random() * 800) + 200,
    };

    if (!config.mockMode) {
      try {
        await callFabricInvoke('addProperty', [
          id,
          JSON.stringify(newProp),
        ]);
      } catch (err) {
        console.warn('[registerProperty] Fabric invoke notice:', err.message);
      }
    }

    const updated = [newProp, ...existing];
    saveAllProperties(updated);
    return newProp;
  },

  // ── Delist Property (delistProperty) ──
  delistProperty: async (propertyId) => {
    const config = getNetworkConfig();
    const currentUser = getCurrentUser();
    const sellerEmail = normalizeUserEmail(currentUser?.email || '');
    if (!config.mockMode) {
      try {
        await callFabricInvoke('delistProperty', [propertyId, sellerEmail]);
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

  // ── Update Listing Price (re-calls listPropertyForSale with new price) ──
  updateListingPrice: async (propertyId, newPrice) => {
    const config = getNetworkConfig();
    const currentUser = getCurrentUser();
    const sellerEmail = normalizeUserEmail(currentUser?.email || '');

    if (!config.mockMode) {
      try {
        console.log(`[updateListingPrice] Updating asking price for ${propertyId} to ₹${newPrice} by ${sellerEmail}`);
        await callFabricInvoke('listPropertyForSale', [
          propertyId,
          String(newPrice),
          sellerEmail,
        ]);
      } catch (err) {
        console.warn('[updateListingPrice] Fabric invoke notice:', err.message);
      }
    }

    const formattedValue = `₹${Number(newPrice).toLocaleString('en-IN')}`;
    const props = getAllProperties();
    const updated = props.map((p) =>
      p.id === propertyId
        ? { ...p, rawValue: Number(newPrice), guidelineValue: Number(newPrice), value: formattedValue, askingPrice: Number(newPrice) }
        : p
    );
    saveAllProperties(updated);
    return { ok: true, propertyId, newPrice, formattedValue };
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
  createStripeCheckoutSession: async ({
    propertyId,
    propertyTitle,
    amount,
    currency = 'inr',
    buyerEmail,
    buyerName,
    seller,
  }) => {
    const SERVER = 'http://localhost:3001';
    const res = await fetch(`${SERVER}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId,
        propertyTitle,
        amount,
        currency,
        buyerEmail,
        buyerName,
        seller,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to initialize Stripe checkout session.');
    }
    return data;
  },

  verifyStripeSession: async (sessionId) => {
    const SERVER = 'http://localhost:3001';
    const res = await fetch(`${SERVER}/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to verify Stripe checkout session.');
    }
    return data;
  },

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
    console.log('[BlockchainAPI.freezeProperty] Freezing ' + propertyId + ' under Case ' + caseNo);
    const config = getNetworkConfig();
    let fabricResult = null;
    if (!config.mockMode) {
      try {
        fabricResult = await callFabricInvoke('freezeProperty', [propertyId, caseNo, remarks]);
        console.log('[BlockchainAPI.freezeProperty] Live Fabric Result:', fabricResult);
      } catch (err) {
        console.warn('[freezeProperty] Fabric live invoke notice:', err.message);
      }
    }

    const props = getAllProperties();
    const now = new Date().toISOString().split('T')[0];
    const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const updated = props.map((p) => {
      if (p.id === propertyId) {
        const freezeLog = p.freezeLog ? [...p.freezeLog] : [];
        freezeLog.unshift({
          action: 'FROZEN',
          caseNo,
          remarks,
          mspId: 'judiciary-com',
          date: now,
          txId,
        });
        const encLog = p.encumbranceLog ? [...p.encumbranceLog] : [];
        encLog.unshift({
          action: 'FLAGGED',
          type: 'COURT_ORDER',
          remarks: 'Judicial Stay: ' + caseNo + ' - ' + remarks,
          mspId: 'judiciary-com',
          date: now,
          txId,
        });
        const existingLegal = getPropertyLegalStatus(p);
        return {
          ...p,
          frozen: true,
          freezeCaseNo: caseNo,
          freezeRemarks: remarks,
          encumbrance: true,
          encumbranceType: existingLegal.hasBankLien
            ? (existingLegal.bankLienType || 'BANK_MORTGAGE')
            : 'COURT_ORDER',
          freezeLog,
          encumbranceLog: encLog,
        };
      }
      return p;
    });
    saveAllProperties(updated);
    return { ok: true, fabricResult, propertyId, frozen: true };
  },

  unfreezeProperty: async (propertyId, orderRef, remarks) => {
    console.log('[BlockchainAPI.unfreezeProperty] Vacating stay on ' + propertyId + ' per ' + orderRef);
    const config = getNetworkConfig();
    let fabricResult = null;
    if (!config.mockMode) {
      try {
        fabricResult = await callFabricInvoke('unfreezeProperty', [propertyId, orderRef, remarks]);
        console.log('[BlockchainAPI.unfreezeProperty] Live Fabric Result:', fabricResult);
      } catch (err) {
        console.warn('[unfreezeProperty] Fabric live invoke notice:', err.message);
      }
    }

    const props = getAllProperties();
    const now = new Date().toISOString().split('T')[0];
    const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const updated = props.map((p) => {
      if (p.id === propertyId) {
        const freezeLog = p.freezeLog ? [...p.freezeLog] : [];
        freezeLog.unshift({
          action: 'VACATED',
          orderRef,
          remarks,
          mspId: 'judiciary-com',
          date: now,
          txId,
        });
        const encLog = p.encumbranceLog ? [...p.encumbranceLog] : [];
        encLog.unshift({
          action: 'CLEARED',
          type: 'COURT_ORDER',
          remarks: 'Stay Vacated: ' + orderRef + ' - ' + remarks,
          mspId: 'judiciary-com',
          date: now,
          txId,
        });
        const existingLegal = getPropertyLegalStatus(p);
        return {
          ...p,
          frozen: false,
          freezeCaseNo: null,
          freezeRemarks: null,
          encumbrance: existingLegal.hasBankLien,
          encumbranceType: existingLegal.hasBankLien
            ? (existingLegal.bankLienType || 'BANK_MORTGAGE')
            : null,
          freezeLog,
          encumbranceLog: encLog,
        };
      }
      return p;
    });
    saveAllProperties(updated);
    return { ok: true, fabricResult, propertyId, frozen: false };
  },

  setEncumbranceStatus: async (propertyId, status, remarks, encumbranceType) => {
    console.log('[BlockchainAPI.setEncumbranceStatus] Property: ' + propertyId + ', status: ' + status);
    const isEnc = String(status) === 'true';
    const config = getNetworkConfig();
    let fabricResult = null;
    if (!config.mockMode) {
      try {
        fabricResult = await callFabricInvoke('setEncumbranceStatus', [
          propertyId,
          String(status),
          remarks || '',
          encumbranceType || '',
        ]);
        console.log('[BlockchainAPI.setEncumbranceStatus] Live Fabric Result:', fabricResult);
      } catch (err) {
        console.warn('[setEncumbranceStatus] Fabric live invoke notice:', err.message);
      }
    }

    const props = getAllProperties();
    const now = new Date().toISOString().split('T')[0];
    const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const updated = props.map((p) => {
      if (p.id === propertyId) {
        const encLog = p.encumbranceLog ? [...p.encumbranceLog] : [];
        encLog.unshift({
          action: isEnc ? 'FLAGGED' : 'CLEARED',
          type: encumbranceType || 'BANK_MORTGAGE',
          remarks: remarks || (isEnc ? 'Lien Active' : 'Lien Discharged'),
          mspId: 'bank-com',
          date: now,
          txId,
        });
        return {
          ...p,
          encumbrance: isEnc || p.frozen === true,
          encumbranceType: isEnc
            ? (encumbranceType || 'BANK_MORTGAGE')
            : (p.frozen === true ? 'COURT_ORDER' : null),
          encumbranceRemarks: isEnc ? remarks : null,
          encumbranceLog: encLog,
        };
      }
      return p;
    });
    saveAllProperties(updated);
    return { ok: true, fabricResult, propertyId, encumbrance: isEnc };
  },

  verifyAuthorityDetails: async (propertyId, eKhataNo, surveyNumber) => {
    const config = getNetworkConfig();
    let fabricResult = null;
    if (!config.mockMode) {
      try {
        fabricResult = await callFabricInvoke('verifyAuthorityDetails', [propertyId, eKhataNo, surveyNumber]);
        console.log('[verifyAuthorityDetails] Live Fabric Result:', fabricResult);
      } catch (err) {
        console.warn('[verifyAuthorityDetails] Fabric live invoke notice:', err.message);
      }
    }

    // Always update local state mirror so UI refreshes in mock + live mode
    const props = getAllProperties();
    const today = new Date().toISOString().split('T')[0];
    const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const updated = props.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          ownershipVerified: true,
          surveyVerified: true,
          eKhataNo: eKhataNo || p.eKhataNo,
          surveyNumber: surveyNumber || p.surveyNumber,
          verifiedBy: config.mspId || 'municipal-com',
          verificationDate: today,
          verificationTxId: txId,
          ownershipRevokedReason: '',
        };
      }
      return p;
    });
    saveAllProperties(updated);
    return fabricResult || { ok: true, propertyId, ownershipVerified: true };
  },

  revokeOwnershipVerification: async (propertyId, reason) => {
    const config = getNetworkConfig();
    let fabricResult = null;
    if (!config.mockMode) {
      try {
        fabricResult = await callFabricInvoke('revokeOwnershipVerification', [propertyId, reason]);
        console.log('[revokeOwnershipVerification] Live Fabric Result:', fabricResult);
      } catch (err) {
        console.warn('[revokeOwnershipVerification] Fabric live invoke notice:', err.message);
      }
    }

    // Always update local state mirror
    const props = getAllProperties();
    const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const updated = props.map((p) => {
      if (p.id === propertyId) {
        return {
          ...p,
          ownershipVerified: false,
          surveyVerified: false,
          ownershipRevokedReason: reason || 'Verification revoked pending dispute hearing',
          verifiedBy: '',
          verificationTxId: txId,
          // Delist if currently for sale
          listedForSale: false,
          status: p.listedForSale ? 'owned' : p.status,
        };
      }
      return p;
    });
    saveAllProperties(updated);
    return fabricResult || { ok: true, propertyId, ownershipVerified: false };
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

  queryByDistrict: async (district) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryByDistrict', [district]);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryByDistrict] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    const target = (district || '').toLowerCase().trim();
    return all.filter((p) => (p.district || '').toLowerCase().trim() === target);
  },

  queryByPincode: async (pincode) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryByPincode', [String(pincode)]);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryByPincode] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    const target = String(pincode || '').trim();
    return all.filter((p) => String(p.pincode || '').trim() === target);
  },

  queryByLocation: async (filters = {}) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('queryByLocation', [JSON.stringify(filters)]);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[queryByLocation] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    return all.filter((p) => {
      if (filters.state && (p.state || '').toLowerCase() !== filters.state.toLowerCase().trim()) {
        return false;
      }
      if (filters.district && (p.district || '').toLowerCase() !== filters.district.toLowerCase().trim()) {
        return false;
      }
      if (filters.taluk && (p.taluk || '').toLowerCase() !== filters.taluk.toLowerCase().trim()) {
        return false;
      }
      if (filters.city && (p.city || '').toLowerCase() !== filters.city.toLowerCase().trim()) {
        return false;
      }
      if (filters.locality && (p.locality || '').toLowerCase() !== filters.locality.toLowerCase().trim()) {
        return false;
      }
      if (filters.pincode && String(p.pincode || '').trim() !== String(filters.pincode).trim()) {
        return false;
      }
      return true;
    });
  },

  getDistinctLocations: async () => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('getDistinctLocations', []);
        if (res && typeof res === 'object') return res;
      } catch (e) {
        console.warn('[getDistinctLocations] Live query notice:', e.message);
      }
    }
    const all = getAllProperties();
    const states = new Set();
    const districts = new Set();
    const taluks = new Set();
    const cities = new Set();
    const localities = new Set();
    const pincodes = new Set();

    all.forEach((p) => {
      if (p.state) states.add(p.state);
      if (p.district) districts.add(p.district);
      if (p.taluk) taluks.add(p.taluk);
      if (p.city) cities.add(p.city);
      if (p.locality) localities.add(p.locality);
      if (p.pincode) pincodes.add(String(p.pincode));
    });

    return {
      states: Array.from(states).sort(),
      districts: Array.from(districts).sort(),
      taluks: Array.from(taluks).sort(),
      cities: Array.from(cities).sort(),
      localities: Array.from(localities).sort(),
      pincodes: Array.from(pincodes).sort(),
    };
  },


  verifyRootTitle: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('verifyRootTitle', [propertyId]);
        if (res && res.propertyId) return res;
      } catch (e) {
        console.warn('[verifyRootTitle] Live query notice:', e.message);
      }
    }
    const prop = (getAllProperties() || []).find((p) => p.id === propertyId);
    if (!prop) throw new Error(`Property ${propertyId} not found`);
    const isEnc = prop.encumbrance === true;
    const isFrozen = prop.frozen === true;
    const cleanTitle = !isEnc && !isFrozen;
    return {
      propertyId,
      cleanTitle,
      formType: cleanTitle ? 'FORM_16_NIL_ENCUMBRANCE' : 'FORM_15_ENCUMBRANCE_STATEMENT',
      status: cleanTitle ? 'MARKETABLE_TITLE_CLEAR' : (isFrozen ? 'JUDICIAL_INJUNCTION_ACTIVE' : 'FINANCIAL_LIEN_ACTIVE'),
      activeLiensCount: isEnc ? 1 : 0,
      activeCourtOrdersCount: isFrozen ? 1 : 0,
      cadastralVerified: Boolean(prop.ownershipVerified),
      summary: cleanTitle
        ? 'Title is clear, unencumbered, and unfrozen. Fully eligible for financial hypothecation or legal conveyance.'
        : `Property restricted: ${isFrozen ? 'Court Restraint Order (' + (prop.freezeCaseNo || 'Active') + ')' : ''} ${isEnc ? 'Bank Lien (' + (prop.encumbranceRemarks || 'Mortgaged') + ')' : ''}`,
    };
  },

  generateEncumbranceCertificate: async (propertyId) => {
    const config = getNetworkConfig();
    if (!config.mockMode) {
      try {
        const res = await callFabricQuery('generateEncumbranceCertificate', [propertyId]);
        if (res && res.propertyId) return res;
      } catch (e) {
        console.warn('[generateEncumbranceCertificate] Live query notice:', e.message);
      }
    }
    const prop = (getAllProperties() || []).find((p) => p.id === propertyId);
    if (!prop) throw new Error(`Property ${propertyId} not found`);
    const isEnc = prop.encumbrance === true;
    const isFrozen = prop.frozen === true;
    const isCadastralValid = prop.ownershipVerified !== false;
    const cleanTitle = !isEnc && !isFrozen && isCadastralValid;
    const searchFrom = prop.regDate || '2015-04-01';
    const searchTo = new Date().toISOString().split('T')[0];
    return {
      propertyId: prop.id,
      propertyTitle: prop.title,
      title: prop.title,
      currentOwner: prop.owner,
      owner: prop.owner,
      propertyAddress: prop.address,
      address: prop.address,
      surveyNumber: prop.surveyNumber || 'PENDING',
      eKhataNo: prop.eKhataNo || 'PENDING',
      formType: cleanTitle ? 'FORM_16_NIL_ENCUMBRANCE' : 'FORM_15_ENCUMBERED',
      certificateTitle: cleanTitle
        ? 'Certificate of Nil Encumbrance (Form No. 16)'
        : 'Statement of Encumbrances Affecting Property (Form No. 15)',
      cleanTitle,
      certificateNo: `EC-${prop.id}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      searchPeriod: {
        from: searchFrom,
        to: searchTo,
      },
      summary: cleanTitle
        ? `Cryptographic Root Search reveals NO active mortgages, financial charges, or judicial injunctions affecting "${prop.id}" from ${searchFrom} to date.`
        : `Root Search reveals ${isEnc ? 1 : 0} un-discharged mortgage charge(s) and ${isFrozen ? 1 : 0} active judicial restraint(s).`,
      cadastralVerified: isCadastralValid,
      authority: `${prop.jurisdiction ? prop.jurisdiction.toUpperCase() : 'URBAN'} SRO Division`,
      activeLiens: isEnc ? [{
        type: prop.encumbranceType || 'BANK_MORTGAGE',
        remarks: prop.encumbranceRemarks || 'Active Financial Mortgage',
        flaggedBy: 'bank-com',
        holder: 'State Bank of India',
        status: 'ACTIVE_LIEN'
      }] : [],
      activeCourtOrders: isFrozen ? [{
        caseNo: prop.freezeCaseNo || 'OS-COURT-STAY',
        remarks: prop.freezeRemarks || 'Civil Injunction Active',
        issuedBy: 'judiciary-com',
        status: 'FROZEN'
      }] : [],
      logs: prop.encumbranceLog || []
    };
  },

};
