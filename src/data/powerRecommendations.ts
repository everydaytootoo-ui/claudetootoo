import { QuickPickItem } from './quickPickCatalog';
import { findDestination, KOREA_POWER } from './destinations';

export interface PowerAdvice {
  plugTypes: string[];
  voltage: number;
  frequencyHz: number;
  needsPlugAdapter: boolean;
  needsVoltageConverter: boolean;
  note: string;
}

/** 여행지 국가의 콘센트/전압을 한국 기준과 비교해 어댑터·변압기 필요 여부를 계산한다 */
export function getPowerAdvice(countryCode: string): PowerAdvice | null {
  const dest = findDestination(countryCode);
  if (!dest) return null;
  const { plugTypes, voltage, frequencyHz } = dest.power;

  const needsPlugAdapter = !plugTypes.some((p) => KOREA_POWER.plugTypes.includes(p));
  // 휴대폰/노트북 충전기는 대부분 100~240V 프리볼트라 실제 변압기가 필요한 경우는 드물지만,
  // 프리볼트가 아닌 드라이기·고데기 등을 챙길 수 있으니 전압차가 크면 참고용으로 안내한다.
  const needsVoltageConverter = Math.abs(voltage - KOREA_POWER.voltage) > 20;

  const plugLabel = `Type ${plugTypes.join('/')}`;
  let note: string;
  if (needsPlugAdapter && needsVoltageConverter) {
    note = `콘센트 모양이 한국과 달라요 (${plugLabel}, ${voltage}V). 돼지코는 꼭 챙기고, 프리볼트가 아닌 드라이기·고데기가 있다면 변압기도 필요해요.`;
  } else if (needsPlugAdapter) {
    note = `콘센트 모양이 한국과 달라요 (${plugLabel}). 전압은 ${voltage}V로 큰 차이가 없어 돼지코만 있으면 충분해요.`;
  } else if (needsVoltageConverter) {
    note = `콘센트는 그대로 꽂을 수 있어요. 다만 전압이 ${voltage}V라 프리볼트가 아닌 전자제품은 변압기가 필요해요.`;
  } else {
    note = `콘센트(${plugLabel})와 전압(${voltage}V) 모두 한국과 비슷해서 별도 어댑터 없이 그대로 쓸 수 있어요.`;
  }

  return { plugTypes, voltage, frequencyHz, needsPlugAdapter, needsVoltageConverter, note };
}

/** 위 계산 결과를 짐싸기 추천 칩에 바로 꽂을 수 있는 아이템 목록으로 변환한다 */
export function getPowerItems(countryCode: string): QuickPickItem[] {
  const advice = getPowerAdvice(countryCode);
  if (!advice) return [];
  const items: QuickPickItem[] = [];
  if (advice.needsPlugAdapter) {
    items.push({
      id: 'power-plug-adapter',
      emoji: '🔌',
      name: `해외용 돼지코 (Type ${advice.plugTypes.join('/')})`,
      restriction: 'none',
    });
  }
  if (advice.needsVoltageConverter) {
    items.push({ id: 'power-voltage-converter', emoji: '⚡', name: '해외용 변압기', restriction: 'none' });
  }
  return items;
}
