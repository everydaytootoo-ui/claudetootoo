import { WeatherSummary } from '../lib/weather';
import { QuickPickItem } from './quickPickCatalog';

/** 예보(또는 평년값)를 보고 챙기면 좋을 아이템을 즉석에서 골라주는 규칙 기반 추천 */
export function getWeatherRecommendations(weather: WeatherSummary): QuickPickItem[] {
  const items: QuickPickItem[] = [];

  if (weather.rainChancePercent >= 30) {
    items.push({ id: 'wx-umbrella', emoji: '☂️', name: '접이식 우산', restriction: 'none' });
  }
  if (weather.minTempC <= 0) {
    items.push({ id: 'wx-hotpack', emoji: '🥵', name: '핫팩', restriction: 'none' });
  }
  if (weather.minTempC <= 8) {
    items.push({ id: 'wx-padding', emoji: '🧥', name: '경량 패딩', restriction: 'none' });
  } else if (weather.minTempC <= 15) {
    items.push({ id: 'wx-cardigan', emoji: '🧶', name: '가벼운 가디건', restriction: 'none' });
  }
  if (weather.maxTempC >= 26) {
    items.push(
      { id: 'wx-sunglasses', emoji: '🕶️', name: '선글라스', restriction: 'none' },
      { id: 'wx-sunscreen', emoji: '🧴', name: '선크림', restriction: 'liquid_over_100ml' }
    );
  }
  if (items.length === 0) {
    items.push({ id: 'wx-basic-layer', emoji: '👕', name: '가벼운 겉옷', restriction: 'none' });
  }
  return items;
}
