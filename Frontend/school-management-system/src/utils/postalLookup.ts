export interface PostalLocationInfo {
  city: string;
  district: string;
  state: string;
  country: string;
  area?: string;
}

const PIN_PREFIX_MAP: Record<string, PostalLocationInfo> = {
  // Karnataka
  '56': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', country: 'India' },
  '57': { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka', country: 'India' },
  '58': { city: 'Hubballi-Dharwad', district: 'Dharwad', state: 'Karnataka', country: 'India' },
  '59': { city: 'Belagavi', district: 'Belagavi', state: 'Karnataka', country: 'India' },
  
  // Telangana & Andhra Pradesh
  '50': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India' },
  '51': { city: 'Tirupati', district: 'Chittoor', state: 'Andhra Pradesh', country: 'India' },
  '52': { city: 'Vijayawada', district: 'NTR District', state: 'Andhra Pradesh', country: 'India' },
  '53': { city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India' },

  // Maharashtra & Goa
  '40': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', country: 'India' },
  '41': { city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India' },
  '42': { city: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India' },
  '43': { city: 'Chhatrapati Sambhajinagar', district: 'Aurangabad', state: 'Maharashtra', country: 'India' },
  '44': { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India' },
  '403': { city: 'Panaji', district: 'North Goa', state: 'Goa', country: 'India' },

  // Delhi NCR, Haryana & Punjab
  '11': { city: 'New Delhi', district: 'New Delhi', state: 'Delhi', country: 'India' },
  '12': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', country: 'India' },
  '13': { city: 'Ambala', district: 'Ambala', state: 'Haryana', country: 'India' },
  '14': { city: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', country: 'India' },
  '15': { city: 'Bathinda', district: 'Bathinda', state: 'Punjab', country: 'India' },
  '16': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', country: 'India' },

  // Tamil Nadu & Puducherry
  '60': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  '61': { city: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu', country: 'India' },
  '62': { city: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', country: 'India' },
  '63': { city: 'Salem', district: 'Salem', state: 'Tamil Nadu', country: 'India' },
  '64': { city: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },

  // West Bengal & North East
  '70': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India' },
  '71': { city: 'Howrah', district: 'Howrah', state: 'West Bengal', country: 'India' },
  '72': { city: 'Kharagpur', district: 'Paschim Medinipur', state: 'West Bengal', country: 'India' },
  '73': { city: 'Siliguri', district: 'Darjeeling', state: 'West Bengal', country: 'India' },
  '78': { city: 'Guwahati', district: 'Kamrup Metropolitan', state: 'Assam', country: 'India' },
  '79': { city: 'Imphal', district: 'Imphal East', state: 'Manipur', country: 'India' },

  // Gujarat
  '38': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  '39': { city: 'Surat', district: 'Surat', state: 'Gujarat', country: 'India' },

  // Rajasthan
  '30': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', country: 'India' },
  '31': { city: 'Udaipur', district: 'Udaipur', state: 'Rajasthan', country: 'India' },
  '32': { city: 'Kota', district: 'Kota', state: 'Rajasthan', country: 'India' },
  '34': { city: 'Jodhpur', district: 'Jodhpur', state: 'Rajasthan', country: 'India' },

  // Uttar Pradesh & Uttarakhand
  '20': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', country: 'India' },
  '21': { city: 'Allahabad (Prayagraj)', district: 'Prayagraj', state: 'Uttar Pradesh', country: 'India' },
  '22': { city: 'Varanasi', district: 'Varanasi', state: 'Uttar Pradesh', country: 'India' },
  '24': { city: 'Dehradun', district: 'Dehradun', state: 'Uttarakhand', country: 'India' },
  '26': { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
  '28': { city: 'Agra', district: 'Agra', state: 'Uttar Pradesh', country: 'India' },

  // Kerala
  '67': { city: 'Kozhikode', district: 'Kozhikode', state: 'Kerala', country: 'India' },
  '68': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', country: 'India' },
  '69': { city: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala', country: 'India' },

  // Madhya Pradesh & Chhattisgarh
  '45': { city: 'Indore', district: 'Indore', state: 'Madhya Pradesh', country: 'India' },
  '46': { city: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
  '49': { city: 'Raipur', district: 'Raipur', state: 'Chhattisgarh', country: 'India' },

  // Bihar & Jharkhand
  '80': { city: 'Patna', district: 'Patna', state: 'Bihar', country: 'India' },
  '83': { city: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', country: 'India' },

  // Odisha
  '75': { city: 'Bhubaneswar', district: 'Khurda', state: 'Odisha', country: 'India' },

  // Himachal Pradesh & J&K
  '17': { city: 'Shimla', district: 'Shimla', state: 'Himachal Pradesh', country: 'India' },
  '19': { city: 'Srinagar', district: 'Srinagar', state: 'Jammu & Kashmir', country: 'India' }
};

const postalCache = new Map<string, PostalLocationInfo>();

export function getOfflinePostalInfo(pinCode: string): PostalLocationInfo | null {
  const clean = pinCode.replace(/\D/g, '').trim();
  if (clean.length < 2) return null;

  const prefix3 = clean.substring(0, 3);
  if (PIN_PREFIX_MAP[prefix3]) return PIN_PREFIX_MAP[prefix3];

  const prefix2 = clean.substring(0, 2);
  if (PIN_PREFIX_MAP[prefix2]) return PIN_PREFIX_MAP[prefix2];

  return null;
}

export async function lookupPostalCode(pinCode: string): Promise<PostalLocationInfo | null> {
  const clean = pinCode.replace(/\D/g, '').trim();
  if (clean.length < 2) return null;

  if (postalCache.has(clean)) {
    return postalCache.get(clean)!;
  }

  const fallback = getOfflinePostalInfo(clean);

  if (clean.length === 6) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const result: PostalLocationInfo = {
          city: po.Block !== 'NA' && po.Block ? po.Block : (po.Division !== 'NA' ? po.Division : po.Name),
          district: po.District,
          state: po.State,
          country: po.Country || 'India',
          area: po.Name
        };
        postalCache.set(clean, result);
        return result;
      }
    } catch (err) {
      console.warn('Postal API lookup error, using fallback:', err);
    }
  }

  return fallback;
}

export const VALID_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const KNOWN_INDIAN_CITIES = [
  'Hyderabad', 'Secunderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada',
  'Bengaluru', 'Bangalore', 'Mysuru', 'Mysore', 'Hubballi', 'Dharwad', 'Mangaluru', 'Mangalore', 'Belagavi', 'Belgaum', 'Kalaburagi', 'Gulbarga', 'Ballari', 'Davangere',
  'Mumbai', 'Bombay', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Navi Mumbai', 'Amravati', 'Nanded',
  'Chennai', 'Madras', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Trichy', 'Salem', 'Erode', 'Vellore', 'Tirunelveli', 'Thanjavur',
  'Kochi', 'Cochin', 'Thiruvananthapuram', 'Trivandrum', 'Kozhikode', 'Calicut', 'Thrissur', 'Kollam', 'Kannur',
  'Kolkata', 'Calcutta', 'Howrah', 'Siliguri', 'Asansol', 'Durgapur', 'Kharagpur',
  'New Delhi', 'Gurugram', 'Gurgaon', 'Noida', 'Ghaziabad', 'Faridabad', 'Greater Noida',
  'Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Allahabad', 'Agra', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur', 'Mathura',
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar',
  'Ahmedabad', 'Surat', 'Vadodara', 'Baroda', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar',
  'Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga',
  'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro',
  'Raipur', 'Bhilai', 'Bilaspur', 'Korba',
  'Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Berhampur',
  'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat',
  'Shillong', 'Imphal', 'Agartala', 'Aizawl', 'Kohima', 'Gangtok', 'Itanagar',
  'Shimla', 'Dharamshala', 'Mandi', 'Solan',
  'Srinagar', 'Jammu', 'Anantnag', 'Baramulla',
  'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh',
  'Panaji', 'Panjim', 'Margao', 'Vasco da Gama',
  'Puducherry', 'Pondicherry', 'Chandigarh'
];

export interface LocationValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStateName(stateInput: string): LocationValidationResult {
  const clean = stateInput.trim();
  if (!clean) {
    return { isValid: false, error: 'State is required.' };
  }

  if (!/^[A-Za-z\s.\-']+$/.test(clean)) {
    return { isValid: false, error: 'State name must contain only alphabetic characters.' };
  }

  const lowerInput = clean.toLowerCase();

  const matchedCity = KNOWN_INDIAN_CITIES.find(city => city.toLowerCase() === lowerInput);
  if (matchedCity) {
    return {
      isValid: false,
      error: `"${clean}" is a City name. Please enter a valid State name (e.g. Telangana, Andhra Pradesh).`
    };
  }

  const isValidState = VALID_INDIAN_STATES.some(state => state.toLowerCase() === lowerInput);
  if (!isValidState) {
    return {
      isValid: false,
      error: `"${clean}" is not a recognized State name. Please enter a valid State (e.g. Telangana, Andhra Pradesh, Maharashtra).`
    };
  }

  return { isValid: true };
}

export function validateCityName(cityInput: string): LocationValidationResult {
  const clean = cityInput.trim();
  if (!clean) {
    return { isValid: false, error: 'City is required.' };
  }

  if (!/^[A-Za-z\s.\-']+$/.test(clean)) {
    return { isValid: false, error: 'City name must contain only alphabetic characters.' };
  }

  const lowerInput = clean.toLowerCase();

  const matchedState = VALID_INDIAN_STATES.find(state => state.toLowerCase() === lowerInput);
  if (matchedState) {
    return {
      isValid: false,
      error: `"${clean}" is a State name. Please enter a valid City name (e.g. Hyderabad, Vijayawada, Visakhapatnam).`
    };
  }

  return { isValid: true };
}

export const WORLD_COUNTRIES = [
  'India',
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
];

export interface CountryDialCode {
  code: string;
  country: string;
  flag: string;
  label: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳', label: '🇮🇳 +91' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', label: '🇺🇸 +1' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', label: '🇬🇧 +44' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', label: '🇦🇪 +971' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', label: '🇦🇺 +61' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', label: '🇸🇦 +966' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', label: '🇶🇦 +974' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', label: '🇰🇼 +965' },
  { code: '+968', country: 'Oman', flag: '🇴🇲', label: '🇴🇲 +968' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭', label: '🇧🇭 +973' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', label: '🇸🇬 +65' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', label: '🇲🇾 +60' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', label: '🇧🇩 +880' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', label: '🇳🇵 +977' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', label: '🇱🇰 +94' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', label: '🇵🇰 +92' },
  { code: '+86', country: 'China', flag: '🇨🇳', label: '🇨🇳 +86' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', label: '🇯🇵 +81' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', label: '🇰🇷 +82' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', label: '🇩🇪 +49' },
  { code: '+33', country: 'France', flag: '🇫🇷', label: '🇫🇷 +33' },
  { code: '+39', country: 'Italy', flag: '🇮🇹', label: '🇮🇹 +39' },
  { code: '+34', country: 'Spain', flag: '🇪🇸', label: '🇪🇸 +34' },
  { code: '+7', country: 'Russia', flag: '🇷🇺', label: '🇷🇺 +7' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', label: '🇧🇷 +55' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', label: '🇿🇦 +27' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', label: '🇳🇬 +234' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', label: '🇰🇪 +254' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', label: '🇪🇬 +20' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', label: '🇳🇿 +64' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', label: '🇵🇭 +63' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', label: '🇹🇭 +66' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', label: '🇻🇳 +84' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', label: '🇮🇩 +62' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷', label: '🇹🇷 +90' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', label: '🇳🇱 +31' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', label: '🇨🇭 +41' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪', label: '🇸🇪 +46' },
  { code: '+47', country: 'Norway', flag: '🇳🇴', label: '🇳🇴 +47' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰', label: '🇩🇰 +45' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪', label: '🇮🇪 +353' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', label: '🇧🇪 +32' },
  { code: '+43', country: 'Austria', flag: '🇦🇹', label: '🇦🇹 +43' },
  { code: '+48', country: 'Poland', flag: '🇵🇱', label: '🇵🇱 +48' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', label: '🇵🇹 +351' },
  { code: '+30', country: 'Greece', flag: '🇬🇷', label: '🇬🇷 +30' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', label: '🇲🇽 +52' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', label: '🇦🇷 +54' },
  { code: '+56', country: 'Chile', flag: '🇨🇱', label: '🇨🇱 +56' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', label: '🇨🇴 +57' },
  { code: '+51', country: 'Peru', flag: '🇵🇪', label: '🇵🇪 +51' }
];

