import { RestrictionCategory } from '../types/models';

/**
 * 이름/이모지 키워드로 품목의 제한 카테고리를 추정하기 위한 사전.
 * 실제 서비스에서는 국가별 세관 API 연동으로 대체 가능하지만,
 * MVP 단계에서는 키워드 매칭 + 유저가 직접 태그 선택하는 방식으로 충분히 커버한다.
 */
export const RESTRICTION_KEYWORDS: Record<RestrictionCategory, string[]> = {
  spare_battery: ['보조배터리', '파워뱅크', 'power bank', 'battery', '배터리'],
  lighter: ['라이터', 'lighter', '토치'],
  liquid_over_100ml: ['샴푸', '린스', '스킨', '로션', '향수', 'perfume', '액체'],
  liquid_under_100ml: ['미니', '트래블사이즈', 'travel size'],
  sharp_object: ['가위', '칼', '맥가이버칼', '면도날', 'scissors', 'knife'],
  aerosol: ['스프레이', 'spray', '헤어스프레이', '선크림스프레이'],
  none: [],
};

export function guessRestrictionCategory(itemName: string): RestrictionCategory {
  const normalized = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(RESTRICTION_KEYWORDS) as [
    RestrictionCategory,
    string[],
  ][]) {
    if (category === 'none') continue;
    if (keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return 'none';
}
