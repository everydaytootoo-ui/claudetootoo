import { Trip } from '../types/models';
import { findDestination } from '../data/destinations';

const NORTH_HEMISPHERE_SEASON_BY_MONTH: Trip['season'][] = [
  'winter', // 1월
  'winter',
  'spring', // 3월
  'spring',
  'spring',
  'summer', // 6월
  'summer',
  'summer',
  'autumn', // 9월
  'autumn',
  'autumn',
  'winter', // 12월
];

const SEASON_FLIP: Record<Trip['season'], Trip['season']> = {
  spring: 'autumn',
  summer: 'winter',
  autumn: 'spring',
  winter: 'summer',
};

/** 출발일 월 + 여행지 반구를 보고 계절을 자동으로 판단한다 (남반구는 북반구와 계절이 반대) */
export function deriveSeason(startDateIso: string, countryCode: string): Trip['season'] {
  const month = new Date(startDateIso).getMonth(); // 0-indexed
  const northSeason = NORTH_HEMISPHERE_SEASON_BY_MONTH[month];
  const hemisphere = findDestination(countryCode)?.hemisphere ?? 'north';
  return hemisphere === 'south' ? SEASON_FLIP[northSeason] : northSeason;
}
