import { SupabaseClient } from '@supabase/supabase-js';
import { BaggageMode, FamilySearchResult, PackItem, RestrictionCategory } from '../types/models';

export type BaggageWarningLevel = 'none' | 'warning' | 'danger';

export interface BaggageValidationResult {
  level: BaggageWarningLevel;
  message: string | null;
}

/**
 * 국제선 일반 기준(항공사별 상이할 수 있음, MVP 기본값)으로
 * 카테고리 x 수하물 모드 조합의 위험도를 판정한다.
 *   - danger : 반입 자체가 금지되어 실제 공항에서 압수/거부될 가능성이 높음
 *   - warning: 금지는 아니지만 용량/개수 제한 등 주의가 필요함
 */
const RULES: Record<RestrictionCategory, Partial<Record<BaggageMode, BaggageValidationResult>>> = {
  spare_battery: {
    checked: {
      level: 'danger',
      message: '⚠️ 보조배터리는 위탁 수하물 반입 금지 품목이에요. 기내(캐리온) 가방으로 옮겨주세요.',
    },
    carryOn: {
      level: 'warning',
      message: '기내 반입은 가능하지만 160Wh 초과 대용량 배터리는 항공사 사전 승인이 필요해요.',
    },
  },
  lighter: {
    checked: {
      level: 'danger',
      message: '⚠️ 라이터는 위탁 수하물 반입 금지 품목이에요. 기내 반입도 1개까지만 허용돼요.',
    },
    carryOn: {
      level: 'warning',
      message: '라이터는 1인당 1개까지만 기내 반입이 가능해요.',
    },
  },
  liquid_over_100ml: {
    carryOn: {
      level: 'danger',
      message: '⚠️ 100ml 초과 액체류는 기내 반입이 금지돼요. 위탁 수하물로 옮겨주세요.',
    },
    checked: { level: 'none', message: null },
  },
  liquid_under_100ml: {
    carryOn: {
      level: 'warning',
      message: '액체류는 1L 투명 지퍼백에 담아야 기내 반입이 가능해요.',
    },
    checked: { level: 'none', message: null },
  },
  sharp_object: {
    carryOn: {
      level: 'danger',
      message: '⚠️ 칼/가위 등 날붙이는 기내 반입이 금지돼요. 위탁 수하물로 옮겨주세요.',
    },
    checked: { level: 'none', message: null },
  },
  aerosol: {
    checked: {
      level: 'warning',
      message: '에어로졸 스프레이는 1개당 0.5kg/0.5L 이하만 위탁 가능해요.',
    },
    carryOn: {
      level: 'warning',
      message: '에어로졸 스프레이는 100ml 이하만 기내 반입이 가능해요.',
    },
  },
  none: {},
};

/**
 * ③-1. 위탁/기내 수하물 반입 금지 자동 검증
 * 물품의 제한 카테고리와, 그 물품이 들어있는 섹션의 수하물 모드(위탁/기내)를 비교해
 * 경고 배지에 사용할 레벨과 안내 메시지를 반환한다.
 */
export function validateBaggagePlacement(
  restriction: RestrictionCategory,
  baggageMode: BaggageMode
): BaggageValidationResult {
  if (restriction === 'none') return { level: 'none', message: null };
  const rule = RULES[restriction]?.[baggageMode];
  return rule ?? { level: 'none', message: null };
}

/** 여러 품목을 한 번에 검사해 경고가 있는 것만 반환 (섹션 진입 시 하단 시트 상단 배너용) */
export function collectBaggageWarnings(
  items: PackItem[],
  baggageMode: BaggageMode
): Array<{ item: PackItem; result: BaggageValidationResult }> {
  return items
    .map((item) => ({ item, result: validateBaggagePlacement(item.restriction, baggageMode) }))
    .filter(({ result }) => result.level !== 'none');
}

/**
 * ③-2. 가족 통합 위치 검색
 * "약", "돼지코" 등 키워드로 여행(tripId) 전체 가방/섹션을 가로질러 검색하고,
 * "[엄마 24인치 캐리어 -> 히든포켓 (실물 사진 첨부)]" 형태로 조립 가능한 결과를 반환한다.
 *
 * items 테이블은 sections(bags(*)) 를 통해 join하며, RLS는 같은 family_id의
 * trip에 대해서만 select를 허용하도록 Supabase 정책에서 제한한다(schema.sql 참고).
 */
export async function searchFamilyItems(
  supabase: SupabaseClient,
  tripId: string,
  keyword: string
): Promise<FamilySearchResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('items')
    .select(
      `
      id, section_id, name, emoji, photo_url, checked, quantity, restriction, created_by,
      section:sections!inner (
        id, name, kind, baggage_mode,
        bag:bags!inner (
          id, trip_id, owner_name, label
        )
      )
    `
    )
    .ilike('name', `%${trimmed}%`)
    .eq('section.bag.trip_id', tripId);

  if (error) throw error;

  return (data ?? []).map((row: any): FamilySearchResult => ({
    item: {
      id: row.id,
      sectionId: row.section_id,
      name: row.name,
      emoji: row.emoji,
      photoUrl: row.photo_url ?? undefined,
      checked: row.checked,
      quantity: row.quantity,
      restriction: row.restriction,
      createdBy: row.created_by,
    },
    bagLabel: row.section.bag.label,
    sectionName: row.section.name,
    ownerName: row.section.bag.owner_name,
  }));
}

/** 검색 결과를 "엄마 24인치 캐리어 -> 히든포켓" 형태의 표시용 문자열로 변환 */
export function formatLocationPath(result: FamilySearchResult): string {
  return `${result.bagLabel} -> ${result.sectionName}`;
}
