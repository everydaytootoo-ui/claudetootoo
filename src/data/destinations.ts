// 여행지 국가/도시 선택 + 전원(콘센트·전압) 기준 사전 데이터

export type PlugType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'I' | 'J' | 'L' | 'O';

export interface CountryPowerInfo {
  plugTypes: PlugType[];
  voltage: number; // V
  frequencyHz: 50 | 60;
}

export interface CityOption {
  name: string;
  lat: number;
  lon: number;
}

export interface DestinationOption {
  code: string; // ISO 3166-1 alpha-2
  nameKo: string;
  flag: string;
  hemisphere: 'north' | 'south';
  cities: CityOption[];
  power: CountryPowerInfo;
}

/** 한국(우리 집 기준) 전원 규격 — 여행지와 비교해 어댑터/변압기 필요 여부를 계산하는 기준값 */
export const KOREA_POWER: CountryPowerInfo = { plugTypes: ['C', 'F'], voltage: 220, frequencyHz: 60 };

export const DESTINATIONS: DestinationOption[] = [
  {
    code: 'JP',
    nameKo: '일본',
    flag: '🇯🇵',
    hemisphere: 'north',
    cities: [
      { name: '오사카', lat: 34.6937, lon: 135.5023 },
      { name: '도쿄', lat: 35.6762, lon: 139.6503 },
      { name: '후쿠오카', lat: 33.5904, lon: 130.4017 },
      { name: '삿포로', lat: 43.0618, lon: 141.3545 },
    ],
    power: { plugTypes: ['A', 'B'], voltage: 100, frequencyHz: 50 },
  },
  {
    code: 'US',
    nameKo: '미국',
    flag: '🇺🇸',
    hemisphere: 'north',
    cities: [
      { name: '뉴욕', lat: 40.7128, lon: -74.006 },
      { name: '로스앤젤레스', lat: 34.0522, lon: -118.2437 },
      { name: '괌', lat: 13.4443, lon: 144.7937 },
      { name: '하와이(호놀룰루)', lat: 21.3069, lon: -157.8583 },
    ],
    power: { plugTypes: ['A', 'B'], voltage: 120, frequencyHz: 60 },
  },
  {
    code: 'CN',
    nameKo: '중국',
    flag: '🇨🇳',
    hemisphere: 'north',
    cities: [
      { name: '베이징', lat: 39.9042, lon: 116.4074 },
      { name: '상하이', lat: 31.2304, lon: 121.4737 },
    ],
    power: { plugTypes: ['A', 'C', 'I'], voltage: 220, frequencyHz: 50 },
  },
  {
    code: 'TW',
    nameKo: '대만',
    flag: '🇹🇼',
    hemisphere: 'north',
    cities: [{ name: '타이베이', lat: 25.033, lon: 121.5654 }],
    power: { plugTypes: ['A', 'B'], voltage: 110, frequencyHz: 60 },
  },
  {
    code: 'HK',
    nameKo: '홍콩',
    flag: '🇭🇰',
    hemisphere: 'north',
    cities: [{ name: '홍콩', lat: 22.3193, lon: 114.1694 }],
    power: { plugTypes: ['G'], voltage: 220, frequencyHz: 50 },
  },
  {
    code: 'TH',
    nameKo: '태국',
    flag: '🇹🇭',
    hemisphere: 'north',
    cities: [
      { name: '방콕', lat: 13.7563, lon: 100.5018 },
      { name: '푸켓', lat: 7.8804, lon: 98.3923 },
    ],
    power: { plugTypes: ['A', 'B', 'C', 'O'], voltage: 220, frequencyHz: 50 },
  },
  {
    code: 'VN',
    nameKo: '베트남',
    flag: '🇻🇳',
    hemisphere: 'north',
    cities: [
      { name: '다낭', lat: 16.0544, lon: 108.2022 },
      { name: '하노이', lat: 21.0278, lon: 105.8342 },
      { name: '호치민', lat: 10.8231, lon: 106.6297 },
    ],
    power: { plugTypes: ['A', 'C', 'G'], voltage: 220, frequencyHz: 50 },
  },
  {
    code: 'PH',
    nameKo: '필리핀',
    flag: '🇵🇭',
    hemisphere: 'north',
    cities: [
      { name: '세부', lat: 10.3157, lon: 123.8854 },
      { name: '마닐라', lat: 14.5995, lon: 120.9842 },
    ],
    power: { plugTypes: ['A', 'B', 'C'], voltage: 220, frequencyHz: 60 },
  },
  {
    code: 'SG',
    nameKo: '싱가포르',
    flag: '🇸🇬',
    hemisphere: 'north',
    cities: [{ name: '싱가포르', lat: 1.3521, lon: 103.8198 }],
    power: { plugTypes: ['G'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'GB',
    nameKo: '영국',
    flag: '🇬🇧',
    hemisphere: 'north',
    cities: [{ name: '런던', lat: 51.5072, lon: -0.1276 }],
    power: { plugTypes: ['G'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'FR',
    nameKo: '프랑스',
    flag: '🇫🇷',
    hemisphere: 'north',
    cities: [{ name: '파리', lat: 48.8566, lon: 2.3522 }],
    power: { plugTypes: ['C', 'E'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'DE',
    nameKo: '독일',
    flag: '🇩🇪',
    hemisphere: 'north',
    cities: [{ name: '베를린', lat: 52.52, lon: 13.405 }],
    power: { plugTypes: ['C', 'F'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'IT',
    nameKo: '이탈리아',
    flag: '🇮🇹',
    hemisphere: 'north',
    cities: [{ name: '로마', lat: 41.9028, lon: 12.4964 }],
    power: { plugTypes: ['C', 'F', 'L'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'ES',
    nameKo: '스페인',
    flag: '🇪🇸',
    hemisphere: 'north',
    cities: [{ name: '바르셀로나', lat: 41.3874, lon: 2.1686 }],
    power: { plugTypes: ['C', 'F'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'AU',
    nameKo: '호주',
    flag: '🇦🇺',
    hemisphere: 'south',
    cities: [
      { name: '시드니', lat: -33.8688, lon: 151.2093 },
      { name: '멜버른', lat: -37.8136, lon: 144.9631 },
    ],
    power: { plugTypes: ['I'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'NZ',
    nameKo: '뉴질랜드',
    flag: '🇳🇿',
    hemisphere: 'south',
    cities: [{ name: '오클랜드', lat: -36.8485, lon: 174.7633 }],
    power: { plugTypes: ['I'], voltage: 230, frequencyHz: 50 },
  },
  {
    code: 'CA',
    nameKo: '캐나다',
    flag: '🇨🇦',
    hemisphere: 'north',
    cities: [{ name: '밴쿠버', lat: 49.2827, lon: -123.1207 }],
    power: { plugTypes: ['A', 'B'], voltage: 120, frequencyHz: 60 },
  },
];

export function findDestination(countryCode: string): DestinationOption | undefined {
  return DESTINATIONS.find((d) => d.code === countryCode);
}
