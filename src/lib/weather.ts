import { Trip } from '../types/models';

export interface WeatherSummary {
  /** 실시간 예보를 받았는지, 여행지가 예보 범위 밖이라 평년값으로 대체했는지 */
  source: 'forecast' | 'seasonal_estimate';
  minTempC: number;
  maxTempC: number;
  rainChancePercent: number;
  condition: string; // "대체로 맑음", "비 소식 있음" 등 한 줄 요약
}

type Season = Trip['season'];

/** 실시간 예보 범위(보통 16일) 밖이거나 좌표가 없을 때 쓰는 국가×계절 평년 기후값 */
const SEASON_CLIMATE_NORMALS: Record<string, Record<Season, WeatherSummary>> = {
  JP: {
    winter: { source: 'seasonal_estimate', minTempC: 2, maxTempC: 10, rainChancePercent: 30, condition: '쌀쌀하고 건조함' },
    spring: { source: 'seasonal_estimate', minTempC: 10, maxTempC: 19, rainChancePercent: 40, condition: '일교차 큼' },
    summer: { source: 'seasonal_estimate', minTempC: 24, maxTempC: 32, rainChancePercent: 55, condition: '고온다습, 소나기 잦음' },
    autumn: { source: 'seasonal_estimate', minTempC: 14, maxTempC: 22, rainChancePercent: 35, condition: '선선하고 쾌적함' },
  },
  DEFAULT: {
    winter: { source: 'seasonal_estimate', minTempC: 0, maxTempC: 8, rainChancePercent: 25, condition: '쌀쌀함' },
    spring: { source: 'seasonal_estimate', minTempC: 8, maxTempC: 18, rainChancePercent: 35, condition: '온화함' },
    summer: { source: 'seasonal_estimate', minTempC: 22, maxTempC: 31, rainChancePercent: 45, condition: '더움' },
    autumn: { source: 'seasonal_estimate', minTempC: 12, maxTempC: 20, rainChancePercent: 30, condition: '선선함' },
  },
};

function seasonalEstimate(countryCode: string, season: Season): WeatherSummary {
  return SEASON_CLIMATE_NORMALS[countryCode]?.[season] ?? SEASON_CLIMATE_NORMALS.DEFAULT[season];
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toIso);
  to.setHours(0, 0, 0, 0);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * 여행지 날씨를 가져온다. Open-Meteo는 API 키 없이 쓸 수 있는 무료 예보 서비스이지만
 * 보통 16일 이내 예보만 제공하므로, 그 범위를 벗어나거나 좌표가 없으면
 * 국가/계절 평년값으로 대체한다 — 항상 뭔가는 추천할 수 있게 하는 게 핵심이다.
 */
export async function fetchTripWeather(trip: Trip): Promise<WeatherSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const daysUntilTrip = daysBetween(today, trip.startDate);
  const withinForecastRange = daysUntilTrip >= 0 && daysUntilTrip <= 15;

  if (trip.lat != null && trip.lon != null && withinForecastRange) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${trip.lat}&longitude=${trip.lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&start_date=${trip.startDate}&end_date=${trip.endDate}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`weather api status ${response.status}`);
      const json = await response.json();
      const maxTemps: number[] = json?.daily?.temperature_2m_max ?? [];
      const minTemps: number[] = json?.daily?.temperature_2m_min ?? [];
      const rainChances: number[] = json?.daily?.precipitation_probability_max ?? [];
      if (maxTemps.length === 0 || minTemps.length === 0) throw new Error('empty forecast');

      const maxTempC = Math.round(Math.max(...maxTemps));
      const minTempC = Math.round(Math.min(...minTemps));
      const rainChancePercent = rainChances.length ? Math.round(Math.max(...rainChances)) : 0;

      return {
        source: 'forecast',
        minTempC,
        maxTempC,
        rainChancePercent,
        condition: rainChancePercent >= 50 ? '비 소식 있음' : '대체로 맑음',
      };
    } catch {
      // 네트워크 오류/예보 범위 초과 등 — 평년값으로 조용히 대체
    }
  }

  return seasonalEstimate(trip.destinationCountry, trip.season);
}
