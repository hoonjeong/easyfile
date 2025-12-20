/**
 * Address Converter Utility for JikguPass
 * Converts Korean addresses to English format for international shopping sites
 */

// Korean name romanization tables (based on Revised Romanization)
const KOREAN_INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const KOREAN_VOWELS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const KOREAN_FINALS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

// Common Korean surnames with preferred romanization
const KOREAN_SURNAMES = {
  '김': 'Kim', '이': 'Lee', '박': 'Park', '최': 'Choi', '정': 'Jung', '강': 'Kang',
  '조': 'Cho', '윤': 'Yoon', '장': 'Jang', '임': 'Lim', '한': 'Han', '오': 'Oh',
  '서': 'Seo', '신': 'Shin', '권': 'Kwon', '황': 'Hwang', '안': 'Ahn', '송': 'Song',
  '류': 'Ryu', '유': 'Yoo', '홍': 'Hong', '전': 'Jeon', '고': 'Ko', '문': 'Moon',
  '양': 'Yang', '손': 'Son', '배': 'Bae', '백': 'Baek', '허': 'Heo', '남': 'Nam',
  '심': 'Shim', '노': 'Noh', '하': 'Ha', '곽': 'Kwak', '성': 'Sung', '차': 'Cha',
  '주': 'Joo', '우': 'Woo', '구': 'Koo', '민': 'Min', '진': 'Jin', '나': 'Na',
  '지': 'Ji', '엄': 'Eom', '채': 'Chae', '원': 'Won', '천': 'Cheon', '방': 'Bang',
  '공': 'Kong', '현': 'Hyun', '함': 'Ham', '변': 'Byun', '염': 'Yeom', '석': 'Seok',
  '선': 'Sun', '설': 'Sul', '마': 'Ma', '길': 'Gil', '연': 'Yeon', '위': 'Wi',
  '표': 'Pyo', '명': 'Myung', '기': 'Ki', '반': 'Ban', '피': 'Pi', '왕': 'Wang',
  '금': 'Keum', '옥': 'Ok', '육': 'Yuk', '인': 'In', '맹': 'Maeng', '제': 'Je',
  '모': 'Mo', '탁': 'Tak', '국': 'Kook', '여': 'Yeo', '어': 'Eo', '사': 'Sa',
};

/**
 * Convert a single Korean syllable to romanized form
 * @param {string} char - Single Korean character
 * @returns {string} - Romanized string
 */
const romanizeSyllable = (char) => {
  const code = char.charCodeAt(0);

  // Check if it's a Korean syllable (가-힣)
  if (code < 0xAC00 || code > 0xD7A3) {
    return char;
  }

  const syllableIndex = code - 0xAC00;
  const initialIndex = Math.floor(syllableIndex / 588);
  const vowelIndex = Math.floor((syllableIndex % 588) / 28);
  const finalIndex = syllableIndex % 28;

  return KOREAN_INITIALS[initialIndex] + KOREAN_VOWELS[vowelIndex] + KOREAN_FINALS[finalIndex];
};

/**
 * Convert Korean name to English (romanized)
 * @param {string} koreanName - Korean name (e.g., "홍길동")
 * @returns {object} - { firstName, lastName, fullName }
 */
export const romanizeKoreanName = (koreanName) => {
  if (!koreanName || !koreanName.trim()) {
    return { firstName: '', lastName: '', fullName: '' };
  }

  const name = koreanName.trim();

  // Check if already contains English characters
  if (/[a-zA-Z]/.test(name)) {
    // Assume it's already romanized, try to split
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        fullName: name
      };
    }
    return { firstName: name, lastName: '', fullName: name };
  }

  // Korean name: typically 2-4 characters, first is surname
  const chars = [...name];

  if (chars.length < 2) {
    const romanized = romanizeSyllable(chars[0]);
    const capitalized = romanized.charAt(0).toUpperCase() + romanized.slice(1);
    return { firstName: capitalized, lastName: '', fullName: capitalized };
  }

  // First character is surname
  const surnameChar = chars[0];
  const givenNameChars = chars.slice(1);

  // Use common surname mapping or romanize
  let surname = KOREAN_SURNAMES[surnameChar];
  if (!surname) {
    const romanized = romanizeSyllable(surnameChar);
    surname = romanized.charAt(0).toUpperCase() + romanized.slice(1);
  }

  // Romanize given name
  let givenName = givenNameChars.map(romanizeSyllable).join('');
  givenName = givenName.charAt(0).toUpperCase() + givenName.slice(1);

  return {
    firstName: givenName,
    lastName: surname,
    fullName: `${givenName} ${surname}`
  };
};

/**
 * Check if string contains Korean characters
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const containsKorean = (str) => {
  if (!str) return false;
  return /[가-힣]/.test(str);
};

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

  const { englishAddress, sido, sigungu, sigunguEnglish, zonecode, buildingName } = koreanAddress;
  const parsedDetail = parseDetailAddress(detailAddress);
  const detailEnglish = translateDetailAddress(parsedDetail.dong, parsedDetail.ho);

  // Build address line 1 (street address only, without city/state)
  let addressLine1 = englishAddress || '';

  // Kakao API returns sigunguEnglish as "Wonmi-gu Bucheon-si" (space-separated)
  // But englishAddress uses comma: "11 Sohyang-ro, Wonmi-gu, Bucheon-si"
  // We need to extract the first part (district/gu) to find it in englishAddress
  let districtEnglish = '';  // e.g., "Wonmi-gu"
  let cityEnglish = '';      // e.g., "Bucheon-si"

  if (sigunguEnglish) {
    // Split by space to separate district and city
    // "Wonmi-gu Bucheon-si" -> ["Wonmi-gu", "Bucheon-si"]
    const sigunguParts = sigunguEnglish.split(/\s+/);
    if (sigunguParts.length >= 2) {
      districtEnglish = sigunguParts[0];  // "Wonmi-gu"
      cityEnglish = sigunguParts.slice(1).join(' ');  // "Bucheon-si"
    } else {
      // Only one part (e.g., Seoul's "Gangnam-gu")
      districtEnglish = sigunguParts[0];
    }
  }

  // Remove city and state from addressLine1, but keep district (gu)
  // "11 Sohyang-ro, Wonmi-gu, Bucheon-si" -> "11 Sohyang-ro, Wonmi-gu"
  if (addressLine1 && cityEnglish) {
    // If there's a city (e.g., "Bucheon-si"), remove from city onwards
    const cityIndex = addressLine1.toLowerCase().indexOf(cityEnglish.toLowerCase());
    if (cityIndex > 0) {
      addressLine1 = addressLine1.substring(0, cityIndex).replace(/,\s*$/, '').trim();
    }
  } else if (addressLine1 && districtEnglish) {
    // For areas without separate city (Seoul gu, or gun areas)
    // First remove state if present
    const state = convertState(sido, 'full');
    if (state) {
      const stateIndex = addressLine1.toLowerCase().lastIndexOf(state.toLowerCase());
      if (stateIndex > 0) {
        addressLine1 = addressLine1.substring(0, stateIndex).replace(/,\s*$/, '').trim();
      }
    }
    // For gun (county) areas, also remove the gun from ADDRESS 1 to avoid duplication with CITY
    // "11 Simgok 2-gil, Eosangcheon-myeon, Danyang-gun" -> "11 Simgok 2-gil, Eosangcheon-myeon"
    if (districtEnglish.endsWith('-gun')) {
      const gunIndex = addressLine1.toLowerCase().lastIndexOf(districtEnglish.toLowerCase());
      if (gunIndex > 0) {
        addressLine1 = addressLine1.substring(0, gunIndex).replace(/,\s*$/, '').trim();
      }
    }
  }

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

    city: cityEnglish || districtEnglish || sigunguEnglish || sigungu || '',
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
        sigunguEnglish: data.sigunguEnglish,
        bname: data.bname,
        roadname: data.roadname,
        buildingName: data.buildingName,
        apartment: data.apartment === 'Y',
      };
      onComplete(result);
    },
  }).open();
};
