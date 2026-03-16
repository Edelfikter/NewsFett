import { getCachedGeo, setCachedGeo } from './redis';

// Country centroids lookup (subset of most common countries)
const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 37.09, lon: -95.71 },
  GB: { lat: 51.51, lon: -0.13 },
  CN: { lat: 35.86, lon: 104.19 },
  RU: { lat: 61.52, lon: 105.32 },
  DE: { lat: 51.17, lon: 10.45 },
  FR: { lat: 46.23, lon: 2.21 },
  JP: { lat: 36.2, lon: 138.25 },
  IN: { lat: 20.59, lon: 78.96 },
  BR: { lat: -14.24, lon: -51.93 },
  AU: { lat: -25.27, lon: 133.78 },
  CA: { lat: 56.13, lon: -106.35 },
  MX: { lat: 23.63, lon: -102.55 },
  ZA: { lat: -30.56, lon: 22.94 },
  NG: { lat: 9.08, lon: 8.68 },
  EG: { lat: 26.82, lon: 30.8 },
  UA: { lat: 48.38, lon: 31.17 },
  PL: { lat: 51.92, lon: 19.15 },
  TR: { lat: 38.96, lon: 35.24 },
  SA: { lat: 23.89, lon: 45.08 },
  KR: { lat: 35.91, lon: 127.77 },
  IT: { lat: 41.87, lon: 12.57 },
  ES: { lat: 40.46, lon: -3.75 },
  AR: { lat: -38.42, lon: -63.62 },
  ID: { lat: -0.79, lon: 113.92 },
  PK: { lat: 30.38, lon: 69.35 },
  IL: { lat: 31.05, lon: 34.85 },
  IR: { lat: 32.43, lon: 53.69 },
  AF: { lat: 33.94, lon: 67.71 },
  IQ: { lat: 33.22, lon: 43.68 },
  SY: { lat: 34.8, lon: 38.99 },
  PS: { lat: 31.95, lon: 35.23 },
  LB: { lat: 33.89, lon: 35.5 },
  YE: { lat: 15.55, lon: 48.52 },
  SD: { lat: 12.86, lon: 30.22 },
  ET: { lat: 9.15, lon: 40.49 },
  KE: { lat: -0.02, lon: 37.91 },
  TZ: { lat: -6.37, lon: 34.89 },
  GH: { lat: 7.95, lon: -1.02 },
  SN: { lat: 14.5, lon: -14.45 },
  MA: { lat: 31.79, lon: -7.09 },
  VN: { lat: 14.06, lon: 108.28 },
  TH: { lat: 15.87, lon: 100.99 },
  MY: { lat: 4.21, lon: 101.98 },
  PH: { lat: 12.88, lon: 121.77 },
  SE: { lat: 60.13, lon: 18.64 },
  NO: { lat: 60.47, lon: 8.47 },
  FI: { lat: 61.92, lon: 25.75 },
  DK: { lat: 56.26, lon: 9.5 },
  NL: { lat: 52.13, lon: 5.29 },
  BE: { lat: 50.5, lon: 4.47 },
  CH: { lat: 46.82, lon: 8.23 },
  AT: { lat: 47.52, lon: 14.55 },
  PT: { lat: 39.4, lon: -8.22 },
  GR: { lat: 39.07, lon: 21.82 },
  NZ: { lat: -40.9, lon: 174.89 },
  CL: { lat: -35.68, lon: -71.54 },
  CO: { lat: 4.57, lon: -74.3 },
  VE: { lat: 6.42, lon: -66.59 },
  PE: { lat: -9.19, lon: -75.02 },
  HU: { lat: 47.16, lon: 19.5 },
  CZ: { lat: 49.82, lon: 15.47 },
  RO: { lat: 45.94, lon: 24.97 },
  SK: { lat: 48.67, lon: 19.7 },
  RS: { lat: 44.02, lon: 21.01 },
  BG: { lat: 42.73, lon: 25.49 },
  HR: { lat: 45.1, lon: 15.2 },
  BY: { lat: 53.71, lon: 27.95 },
  KZ: { lat: 48.02, lon: 66.92 },
  UZ: { lat: 41.38, lon: 64.59 },
  AZ: { lat: 40.14, lon: 47.58 },
  GE: { lat: 42.32, lon: 43.36 },
  BA: { lat: 43.92, lon: 17.68 },
  AL: { lat: 41.15, lon: 20.17 },
  MK: { lat: 41.61, lon: 21.75 },
  SI: { lat: 46.15, lon: 14.99 },
  EE: { lat: 58.6, lon: 25.01 },
  LV: { lat: 56.88, lon: 24.6 },
  LT: { lat: 55.17, lon: 23.88 },
  MD: { lat: 47.41, lon: 28.37 },
  CU: { lat: 21.52, lon: -77.78 },
  WORLD: { lat: 20, lon: 0 },
};

// Keywords that might indicate countries in news text
const COUNTRY_KEYWORDS: [string, string][] = [
  ['united states', 'US'], ['america', 'US'], ['washington', 'US'], ['new york', 'US'],
  ['united kingdom', 'GB'], ['britain', 'GB'], ['england', 'GB'], ['london', 'GB'],
  ['china', 'CN'], ['beijing', 'CN'], ['shanghai', 'CN'],
  ['russia', 'RU'], ['moscow', 'RU'], ['kremlin', 'RU'],
  ['germany', 'DE'], ['berlin', 'DE'],
  ['france', 'FR'], ['paris', 'FR'],
  ['japan', 'JP'], ['tokyo', 'JP'],
  ['india', 'IN'], ['delhi', 'IN'], ['mumbai', 'IN'],
  ['brazil', 'BR'], ['brasilia', 'BR'],
  ['australia', 'AU'], ['sydney', 'AU'], ['canberra', 'AU'],
  ['canada', 'CA'], ['ottawa', 'CA'], ['toronto', 'CA'],
  ['ukraine', 'UA'], ['kyiv', 'UA'],
  ['israel', 'IL'], ['jerusalem', 'IL'], ['tel aviv', 'IL'],
  ['iran', 'IR'], ['tehran', 'IR'],
  ['iraq', 'IQ'], ['baghdad', 'IQ'],
  ['syria', 'SY'], ['damascus', 'SY'],
  ['turkey', 'TR'], ['ankara', 'TR'],
  ['saudi arabia', 'SA'], ['riyadh', 'SA'],
  ['south africa', 'ZA'], ['johannesburg', 'ZA'],
  ['nigeria', 'NG'], ['abuja', 'NG'],
  ['egypt', 'EG'], ['cairo', 'EG'],
  ['pakistan', 'PK'], ['islamabad', 'PK'],
  ['afghanistan', 'AF'], ['kabul', 'AF'],
  ['north korea', 'KR'], ['south korea', 'KR'], ['seoul', 'KR'],
  ['mexico', 'MX'], ['mexico city', 'MX'],
  ['italy', 'IT'], ['rome', 'IT'],
  ['spain', 'ES'], ['madrid', 'ES'],
  ['argentina', 'AR'], ['buenos aires', 'AR'],
  ['indonesia', 'ID'], ['jakarta', 'ID'],
  ['sweden', 'SE'], ['stockholm', 'SE'],
  ['netherlands', 'NL'], ['amsterdam', 'NL'],
  ['switzerland', 'CH'], ['bern', 'CH'],
  ['venezuela', 'VE'], ['caracas', 'VE'],
  ['colombia', 'CO'], ['bogota', 'CO'],
  ['chile', 'CL'], ['santiago', 'CL'],
  ['peru', 'PE'], ['lima', 'PE'],
  ['cuba', 'CU'], ['havana', 'CU'],
  ['gaza', 'PS'], ['west bank', 'PS'], ['palestine', 'PS'],
  ['lebanon', 'LB'], ['beirut', 'LB'],
  ['yemen', 'YE'], ['sanaa', 'YE'],
  ['sudan', 'SD'], ['khartoum', 'SD'],
  ['ethiopia', 'ET'], ['addis ababa', 'ET'],
  ['kenya', 'KE'], ['nairobi', 'KE'],
  ['ghana', 'GH'], ['accra', 'GH'],
  ['vietnam', 'VN'], ['hanoi', 'VN'],
  ['thailand', 'TH'], ['bangkok', 'TH'],
  ['malaysia', 'MY'], ['kuala lumpur', 'MY'],
  ['philippines', 'PH'], ['manila', 'PH'],
  ['poland', 'PL'], ['warsaw', 'PL'],
  ['belarus', 'BY'], ['minsk', 'BY'],
  ['kazakhstan', 'KZ'], ['nur-sultan', 'KZ'],
  ['new zealand', 'NZ'], ['wellington', 'NZ'],
  ['morocco', 'MA'], ['rabat', 'MA'],
  ['senegal', 'SN'], ['dakar', 'SN'],
  ['tanzania', 'TZ'], ['dodoma', 'TZ'],
  ['portugal', 'PT'], ['lisbon', 'PT'],
  ['greece', 'GR'], ['athens', 'GR'],
  ['czech', 'CZ'], ['prague', 'CZ'],
  ['hungary', 'HU'], ['budapest', 'HU'],
  ['romania', 'RO'], ['bucharest', 'RO'],
  ['serbia', 'RS'], ['belgrade', 'RS'],
  ['bulgaria', 'BG'], ['sofia', 'BG'],
];

export function extractLocationFromText(text: string): string | null {
  const lower = text.toLowerCase();
  let best: string | null = null;
  for (const [keyword] of COUNTRY_KEYWORDS) {
    if (lower.includes(keyword)) {
      if (!best || keyword.length > best.length) best = keyword;
    }
  }
  return best;
}

export function getCountryCodeFromText(text: string): string | null {
  const lower = text.toLowerCase();
  let bestKeyword = '';
  let bestCode: string | null = null;
  for (const [keyword, code] of COUNTRY_KEYWORDS) {
    if (lower.includes(keyword) && keyword.length > bestKeyword.length) {
      bestKeyword = keyword;
      bestCode = code;
    }
  }
  return bestCode;
}

export function getCountryCentroid(code: string): { lat: number; lon: number } {
  return COUNTRY_CENTROIDS[code] || COUNTRY_CENTROIDS['WORLD'];
}

export async function geocodeText(
  text: string
): Promise<{ lat: number; lon: number } | null> {
  // Try cache first
  try {
    const cached = await getCachedGeo(text);
    if (cached) return cached;
  } catch {
    // Redis may not be available
  }

  // Try Nominatim
  try {
    const userAgent = process.env.GEOCODE_USER_AGENT || 'NewsFett/1.0';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const result = { lat: parseFloat(lat), lon: parseFloat(lon) };
        try {
          await setCachedGeo(text, result.lat, result.lon);
        } catch {
          // ignore cache errors
        }
        return result;
      }
    }
  } catch {
    // ignore geocoding errors
  }

  return null;
}

export async function resolveItemLocation(
  title: string,
  description: string,
  geoLat?: number,
  geoLon?: number
): Promise<{ lat: number; lon: number }> {
  // 1) Use embedded geo tags if present
  if (geoLat && geoLon && !isNaN(geoLat) && !isNaN(geoLon)) {
    return { lat: geoLat, lon: geoLon };
  }

  // 2) Extract country code from title or description
  const text = `${title} ${description}`;
  const code = getCountryCodeFromText(text);
  if (code) {
    return getCountryCentroid(code);
  }

  // 3) Try Nominatim for specific place names (only if text is short enough)
  const location = extractLocationFromText(text);
  if (location) {
    const result = await geocodeText(location);
    if (result) return result;
  }

  // 4) Default to world center
  return { lat: 20, lon: 0 };
}
