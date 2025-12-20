/**
 * Address Converter Utility for JikguPass
 * Converts Korean addresses to English format for international shopping sites
 */

// Korean Province/City to English mapping
export const STATE_MAPPINGS = {
  '서울특별시': { full: 'Seoul', abbr: 'Seoul' },
  '서울': { full: 'Seoul', abbr: 'Seoul' },
  '부산광역시': { full: 'Busan', abbr: 'Busan' },
  '부산': { full: 'Busan', abbr: 'Busan' },
  '대구광역시': { full: 'Daegu', abbr: 'Daegu' },
  '대구': { full: 'Daegu', abbr: 'Daegu' },
  '인천광역시': { full: 'Incheon', abbr: 'Incheon' },
  '인천': { full: 'Incheon', abbr: 'Incheon' },
  '광주광역시': { full: 'Gwangju', abbr: 'Gwangju' },
  '광주': { full: 'Gwangju', abbr: 'Gwangju' },
  '대전광역시': { full: 'Daejeon', abbr: 'Daejeon' },
  '대전': { full: 'Daejeon', abbr: 'Daejeon' },
  '울산광역시': { full: 'Ulsan', abbr: 'Ulsan' },
  '울산': { full: 'Ulsan', abbr: 'Ulsan' },
  '세종특별자치시': { full: 'Sejong', abbr: 'Sejong' },
  '세종': { full: 'Sejong', abbr: 'Sejong' },
  '경기도': { full: 'Gyeonggi-do', abbr: 'Gyeonggi' },
  '경기': { full: 'Gyeonggi-do', abbr: 'Gyeonggi' },
  '강원특별자치도': { full: 'Gangwon-do', abbr: 'Gangwon' },
  '강원도': { full: 'Gangwon-do', abbr: 'Gangwon' },
  '강원': { full: 'Gangwon-do', abbr: 'Gangwon' },
  '충청북도': { full: 'Chungcheongbuk-do', abbr: 'Chungbuk' },
  '충북': { full: 'Chungcheongbuk-do', abbr: 'Chungbuk' },
  '충청남도': { full: 'Chungcheongnam-do', abbr: 'Chungnam' },
  '충남': { full: 'Chungcheongnam-do', abbr: 'Chungnam' },
  '전북특별자치도': { full: 'Jeollabuk-do', abbr: 'Jeonbuk' },
  '전라북도': { full: 'Jeollabuk-do', abbr: 'Jeonbuk' },
  '전북': { full: 'Jeollabuk-do', abbr: 'Jeonbuk' },
  '전라남도': { full: 'Jeollanam-do', abbr: 'Jeonnam' },
  '전남': { full: 'Jeollanam-do', abbr: 'Jeonnam' },
  '경상북도': { full: 'Gyeongsangbuk-do', abbr: 'Gyeongbuk' },
  '경북': { full: 'Gyeongsangbuk-do', abbr: 'Gyeongbuk' },
  '경상남도': { full: 'Gyeongsangnam-do', abbr: 'Gyeongnam' },
  '경남': { full: 'Gyeongsangnam-do', abbr: 'Gyeongnam' },
  '제주특별자치도': { full: 'Jeju-do', abbr: 'Jeju' },
  '제주도': { full: 'Jeju-do', abbr: 'Jeju' },
  '제주': { full: 'Jeju-do', abbr: 'Jeju' },
};

// Shopping site presets
export const SITE_PRESETS = {
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    nameFormat: 'fullName',
    addressLine1Max: 35,
    addressLine2Max: 35,
    stateFormat: 'full',
    phoneFormat: 'international',
    showPccc: false,
  },
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    nameFormat: 'split',
    addressLine1Max: 128,
    addressLine2Max: 128,
    stateFormat: 'full',
    phoneFormat: 'international',
    showPccc: true,
  },
  iherb: {
    id: 'iherb',
    name: 'iHerb',
    nameFormat: 'split',
    addressLine1Max: 40,
    addressLine2Max: 40,
    stateFormat: 'full',
    phoneFormat: 'local',
    showPccc: true,
  },
  ebay: {
    id: 'ebay',
    name: 'eBay',
    nameFormat: 'split',
    addressLine1Max: 35,
    addressLine2Max: 35,
    stateFormat: 'abbr',
    phoneFormat: 'international',
    showPccc: false,
  },
  general: {
    id: 'general',
    name: 'General',
    nameFormat: 'split',
    addressLine1Max: 50,
    addressLine2Max: 50,
    stateFormat: 'full',
    phoneFormat: 'international',
    showPccc: true,
  },
};

// Abbreviations for address length reduction
const ABBREVIATIONS = [
  { full: 'Apartment', short: 'Apt' },
  { full: 'Building', short: 'Bldg' },
  { full: 'Street', short: 'St' },
  { full: 'Road', short: 'Rd' },
  { full: 'Boulevard', short: 'Blvd' },
  { full: 'Avenue', short: 'Ave' },
  { full: 'Floor', short: 'Fl' },
  { full: 'Suite', short: 'Ste' },
  { full: 'Department', short: 'Dept' },
  { full: 'Chungcheongbuk-do', short: 'Chungbuk' },
  { full: 'Chungcheongnam-do', short: 'Chungnam' },
  { full: 'Gyeongsangbuk-do', short: 'Gyeongbuk' },
  { full: 'Gyeongsangnam-do', short: 'Gyeongnam' },
  { full: 'Jeollabuk-do', short: 'Jeonbuk' },
  { full: 'Jeollanam-do', short: 'Jeonnam' },
  { full: 'Gangwon-do', short: 'Gangwon' },
  { full: 'Gyeonggi-do', short: 'Gyeonggi' },
  { full: 'Jeju-do', short: 'Jeju' },
];

/**
 * Parse detail address (dong/ho) from Korean input
 * @param {string} input - Korean detail address (e.g., "101동 1501호")
 * @returns {object} - { dong, ho, raw }
 */
export const parseDetailAddress = (input) => {
  if (!input || !input.trim()) {
    return { dong: '', ho: '', raw: '' };
  }

  const trimmed = input.trim();

  // Pattern: 숫자동 숫자호 (101동 1501호)
  const pattern1 = /(\d+)\s*동\s*(\d+)\s*호/;
  // Pattern: 영문/한글동 숫자호 (A동 302호, 가동 101호)
  const pattern2 = /([A-Za-z가-힣]+)\s*동\s*(\d+)\s*호/;
  // Pattern: 숫자-숫자 (101-1501)
  const pattern3 = /^(\d+)\s*[-]\s*(\d+)$/;
  // Pattern: 숫자호만 (1501호)
  const pattern4 = /^(\d+)\s*호$/;
  // Pattern: 숫자동만 (101동)
  const pattern5 = /^(\d+)\s*동$/;

  let match;

  if ((match = trimmed.match(pattern1))) {
    return { dong: match[1], ho: match[2], raw: trimmed };
  }
  if ((match = trimmed.match(pattern2))) {
    return { dong: match[1], ho: match[2], raw: trimmed };
  }
  if ((match = trimmed.match(pattern3))) {
    return { dong: match[1], ho: match[2], raw: trimmed };
  }
  if ((match = trimmed.match(pattern4))) {
    return { dong: '', ho: match[1], raw: trimmed };
  }
  if ((match = trimmed.match(pattern5))) {
    return { dong: match[1], ho: '', raw: trimmed };
  }

  // No pattern matched, return raw input
  return { dong: '', ho: '', raw: trimmed };
};

/**
 * Translate detail address to English
 * @param {string} dong - Building/dong number
 * @param {string} ho - Unit/ho number
 * @returns {string} - English formatted detail address
 */
export const translateDetailAddress = (dong, ho) => {
  if (!dong && !ho) return '';

  if (dong && ho) {
    // Check if dong is a letter (A, B, C, etc.)
    if (/^[A-Za-z]+$/.test(dong)) {
      return `Bldg ${dong.toUpperCase()}, Unit ${ho}`;
    }
    return `Bldg ${dong}, Unit ${ho}`;
  }

  if (dong) {
    if (/^[A-Za-z]+$/.test(dong)) {
      return `Bldg ${dong.toUpperCase()}`;
    }
    return `Bldg ${dong}`;
  }

  if (ho) {
    return `Unit ${ho}`;
  }

  return '';
};

/**
 * Apply abbreviations to reduce text length
 * @param {string} text - Original text
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} - { text, abbreviated }
 */
export const applyAbbreviations = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return { text, abbreviated: false };
  }

  let result = text;
  let abbreviated = false;

  for (const { full, short } of ABBREVIATIONS) {
    if (result.length <= maxLength) break;
    const regex = new RegExp(full, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, short);
      abbreviated = true;
    }
  }

  // If still too long, truncate
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
    abbreviated = true;
  }

  return { text: result, abbreviated };
};

/**
 * Convert state/province name
 * @param {string} sido - Korean state/province name
 * @param {string} format - 'full' or 'abbr'
 * @returns {string} - English state name
 */
export const convertState = (sido, format = 'full') => {
  if (!sido) return '';

  const mapping = STATE_MAPPINGS[sido];
  if (mapping) {
    return format === 'abbr' ? mapping.abbr : mapping.full;
  }

  // Return as-is if no mapping found
  return sido;
};

/**
 * Format phone number
 * @param {string} phone - Korean phone number
 * @param {string} format - 'international' or 'local'
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone, format = 'international') => {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) return phone;

  // Korean mobile: 010-1234-5678
  if (digits.startsWith('010') || digits.startsWith('011') || digits.startsWith('016') ||
      digits.startsWith('017') || digits.startsWith('018') || digits.startsWith('019')) {
    if (format === 'international') {
      return `+82-${digits.substring(1, 3)}-${digits.substring(3, 7)}-${digits.substring(7)}`;
    }
    return `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7)}`;
  }

  // Korean landline: 02-1234-5678 or 031-123-4567
  if (digits.startsWith('02')) {
    if (format === 'international') {
      return `+82-2-${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return `02-${digits.substring(2, 6)}-${digits.substring(6)}`;
  }

  // Other area codes (3 digits)
  if (format === 'international') {
    return `+82-${digits.substring(1, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
};

/**
 * Validate PCCC (Personal Customs Clearance Code)
 * @param {string} pccc - PCCC to validate
 * @returns {boolean} - Is valid
 */
export const validatePccc = (pccc) => {
  if (!pccc) return false;
  // PCCC format: P + 12 digits (total 13 characters)
  return /^P\d{12}$/.test(pccc.toUpperCase());
};

/**
 * Main address conversion function
 * @param {object} params - Conversion parameters
 * @returns {object} - Converted address fields
 */
export const convertAddress = ({
  koreanAddress,
  detailAddress,
  userName,
  phone,
  pccc,
  sitePreset,
}) => {
  const preset = typeof sitePreset === 'string' ? SITE_PRESETS[sitePreset] : sitePreset;

  if (!koreanAddress || !preset) {
    return null;
  }

  const { englishAddress, sido, sigungu, zonecode, buildingName } = koreanAddress;
  const parsedDetail = parseDetailAddress(detailAddress);
  const detailEnglish = translateDetailAddress(parsedDetail.dong, parsedDetail.ho);

  // Build address line 1 (street address)
  let addressLine1 = englishAddress || '';

  // Build address line 2 (detail + building name)
  let addressLine2Parts = [];
  if (detailEnglish) {
    addressLine2Parts.push(detailEnglish);
  }
  if (buildingName && !addressLine1.includes(buildingName)) {
    // Only add building name if not already in address
    addressLine2Parts.push(`(${buildingName})`);
  }
  let addressLine2 = addressLine2Parts.join(' ');

  // If detail address is just raw text (no dong/ho pattern), use it directly
  if (!parsedDetail.dong && !parsedDetail.ho && parsedDetail.raw) {
    addressLine2 = parsedDetail.raw;
  }

  // Apply abbreviations if needed
  const line1Result = applyAbbreviations(addressLine1, preset.addressLine1Max);
  const line2Result = applyAbbreviations(addressLine2, preset.addressLine2Max);

  // Convert state
  const state = convertState(sido, preset.stateFormat);

  // Format phone
  const formattedPhone = formatPhone(phone, preset.phoneFormat);

  // Parse name
  const nameParts = userName ? userName.trim().split(/\s+/) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Build result
  const result = {
    // Name fields
    fullName: userName || '',
    firstName,
    lastName,

    // Address fields
    addressLine1: line1Result.text,
    addressLine1Warning: line1Result.abbreviated,
    addressLine1Length: line1Result.text.length,
    addressLine1Max: preset.addressLine1Max,

    addressLine2: line2Result.text,
    addressLine2Warning: line2Result.abbreviated,
    addressLine2Length: line2Result.text.length,
    addressLine2Max: preset.addressLine2Max,

    city: sigungu || '',
    state,
    zipCode: zonecode || '',
    country: 'South Korea',
    countryCode: 'KR',

    // Contact
    phone: formattedPhone,

    // PCCC
    pccc: pccc || '',
    pcccValid: validatePccc(pccc),
    showPccc: preset.showPccc,

    // Meta
    nameFormat: preset.nameFormat,
    siteName: preset.name,
  };

  return result;
};

/**
 * Load Kakao Postcode script dynamically
 * @returns {Promise} - Resolves when script is loaded
 */
export const loadKakaoPostcode = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.daum && window.daum.Postcode) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Kakao Postcode script'));
    document.head.appendChild(script);
  });
};

/**
 * Open Kakao Postcode popup
 * @param {function} onComplete - Callback when address is selected
 * @returns {Promise} - Resolves when popup opens
 */
export const openKakaoPostcode = async (onComplete) => {
  await loadKakaoPostcode();

  new window.daum.Postcode({
    oncomplete: (data) => {
      const result = {
        zonecode: data.zonecode,
        roadAddress: data.roadAddress,
        jibunAddress: data.jibunAddress,
        englishAddress: data.roadAddressEnglish,
        sido: data.sido,
        sigungu: data.sigungu,
        bname: data.bname,
        roadname: data.roadname,
        buildingName: data.buildingName,
        apartment: data.apartment === 'Y',
      };
      onComplete(result);
    },
  }).open();
};
