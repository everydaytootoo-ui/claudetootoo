import { Bag, PackItem } from '../types/models';
import { estimateItemWeightGrams } from '../data/itemWeights';

export type WeightLevel = 'safe' | 'caution' | 'over';

export interface BagWeightSummary {
  estimatedGrams: number;
  limitGrams: number;
  ratio: number; // 0~1+ (1을 넘으면 초과)
  level: WeightLevel;
}

/**
 * ② 수하물 예상 무게 계산기
 * 위탁 수하물(baggageMode === 'checked') 구역에 담긴 물품만 합산한다 —
 * 기내 반입 가방은 항공사 위탁 허용량과 무관하기 때문.
 */
export function computeCheckedBaggageWeight(bag: Bag, items: PackItem[]): BagWeightSummary {
  const checkedSectionIds = new Set(bag.sections.filter((s) => s.baggageMode === 'checked').map((s) => s.id));

  const estimatedGrams = items
    .filter((item) => checkedSectionIds.has(item.sectionId))
    .reduce((sum, item) => sum + estimateItemWeightGrams(item.name) * item.quantity, 0);

  const limitGrams = bag.weightLimitKg * 1000;
  const ratio = limitGrams > 0 ? estimatedGrams / limitGrams : 0;
  const level: WeightLevel = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'caution' : 'safe';

  return { estimatedGrams, limitGrams, ratio, level };
}
