// PackWith (팩위드) — 공용 도메인 타입 정의

export type BagKind = 'carryon20' | 'carryon24' | 'carryon28' | 'backpack' | 'boston';

export type BagColor =
  | 'pastel_pink'
  | 'butter_yellow'
  | 'cream_white'
  | 'sage_green'
  | 'sky_blue'
  | 'charcoal_black';

export const BAG_COLOR_HEX: Record<BagColor, string> = {
  pastel_pink: '#F7C9CF',
  butter_yellow: '#F5E1A0',
  cream_white: '#FBF7F0',
  sage_green: '#C6D8C4',
  sky_blue: '#C7E0F4',
  charcoal_black: '#3A3A3E',
};

/** 가방 겉면에 붙이는 스티커/키링 에셋 */
export interface DecorationAsset {
  id: string;
  type: 'sticker' | 'keyring';
  emoji?: string; // 이모지 기반 스티커(국기 등)는 emoji만 사용
  imageUrl?: string; // 커스텀 이미지 스티커/키링
  label: string;
  isPremium: boolean; // AdMob 보상형 광고로 해금되는 한정판 여부
}

/** 캔버스 위에 실제로 배치된 스티커/키링 인스턴스 */
export interface StickerPlacement {
  id: string;
  assetId: string;
  x: number; // 캔버스 좌표계(0~1 정규화) 기준 중심 x
  y: number; // 0~1 정규화 중심 y
  rotation: number; // degree
  scale: number; // 1 = 원본 크기
  zIndex: number;
}

export interface BagDecoration {
  bagId: string;
  color: BagColor;
  placements: StickerPlacement[];
}

/** 위탁/기내 수하물 여부 — 섹션이 물리적으로 어느 가방에 속하는지에 따라 결정 */
export type BaggageMode = 'checked' | 'carryOn';

export type SectionKind =
  | 'main-left'
  | 'main-right'
  | 'hidden-pocket'
  | 'top-zip'
  | 'laptop-slot'
  | 'custom';

export interface BagSection {
  id: string;
  bagId: string;
  kind: SectionKind;
  name: string; // 커스텀 섹션은 유저가 직접 이름 입력 ("히든 포켓" 등)
  icon: string; // 이모지 아이콘
  baggageMode: BaggageMode;
  isCustom: boolean;
}

export interface Bag {
  id: string;
  tripId: string;
  ownerName: string; // "엄마", "아빠" 등 가족 구성원 표시명
  kind: BagKind;
  label: string; // "엄마 24인치 캐리어"
  decoration: BagDecoration;
  sections: BagSection[];
}

/** 위험/제한 품목 카테고리 (수하물 규정 자동 알림에 사용) */
export type RestrictionCategory =
  | 'spare_battery'
  | 'lighter'
  | 'liquid_over_100ml'
  | 'liquid_under_100ml'
  | 'sharp_object'
  | 'aerosol'
  | 'none';

export interface PackItem {
  id: string;
  sectionId: string;
  name: string;
  emoji: string;
  photoUrl?: string; // 실물 사진 (Supabase Storage URL)
  checked: boolean;
  quantity: number;
  restriction: RestrictionCategory;
  createdBy: string;
}

export interface Trip {
  id: string;
  familyId: string;
  name: string;
  destinationCountry: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  startDate: string; // ISO date
  endDate: string; // ISO date
  inviteCode: string; // 6자리 초대 코드
}

/** 통합 검색 결과 — "약" 검색 시 정확한 위치 + 사진 반환 */
export interface FamilySearchResult {
  item: PackItem;
  bagLabel: string; // "엄마 24인치 캐리어"
  sectionName: string; // "히든포켓"
  ownerName: string;
}
