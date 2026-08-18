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
  | 'essentials' // 필수 지참품 — 이름은 유저가 바꿀 수 있어도 이 kind로 항상 식별한다
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
  /** 항공사 위탁 수하물 허용 무게(kg). 15/20/23/32kg 중 선택하는 게 일반적 */
  weightLimitKg: number;
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
  /** 여권/지갑/신분증 등 — 놓치면 출발 자체가 막히는 필수 지참품 여부 */
  isEssential: boolean;
  /** isEssential 품목을 그룹원이 "확인했어요"로 상호 검증한 표시명 목록 */
  confirmedBy: string[];
}

/**
 * 여행을 함께 준비하는 사람들의 공간(Crew). 가족뿐 아니라 친구끼리도
 * 6자리 초대 코드로 동일한 공간에 합류해 같은 trip을 공유할 수 있다.
 * (DB 테이블명은 하위 호환을 위해 families/family_members를 유지하지만
 * 실제로는 "가족 또는 친구로 구성된 여행 크루" 전체를 의미한다.)
 */
export interface Trip {
  id: string;
  familyId: string; // = crewId
  name: string;
  destinationCountry: string;
  destinationCity?: string; // "오사카" — 날씨 카드 표시용
  lat?: number; // 날씨 API 조회용 좌표 (없으면 국가/계절 기반 평년값으로 대체)
  lon?: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  startDate: string; // ISO date
  endDate: string; // ISO date
  inviteCode: string; // 6자리 초대 코드
}

export type TripMemberRelation = 'family' | 'friend' | 'me';

/** 여행 크루 구성원 — 가족/친구 구분 없이 동일하게 취급 */
export interface TripMember {
  id: string;
  tripId: string;
  displayName: string; // "엄마", "민지" 등
  relation: TripMemberRelation;
  joinedAt: string; // ISO datetime
}

/** 통합 검색 결과 — "약" 검색 시 정확한 위치 + 사진 반환 */
export interface FamilySearchResult {
  item: PackItem;
  bagLabel: string; // "엄마 24인치 캐리어"
  sectionName: string; // "히든포켓"
  ownerName: string;
  baggageMode: BaggageMode; // 검색 결과에도 위탁/기내 반입 경고를 함께 보여주기 위함
}

/** 캘린더 — 일자별 세부 일정 */
export interface CalendarEvent {
  id: string;
  tripId: string;
  date: string; // ISO date (YYYY-MM-DD)
  time?: string; // "14:30" — 없으면 종일 일정
  title: string;
  memo?: string;
  category: 'flight' | 'hotel' | 'activity' | 'food' | 'transport' | 'etc';
  createdBy: string;
}

/** 바우처/메모 보관함 — 항공권 PDF, 호텔 예약증, QR, 오프라인 메모 */
export type VaultDocumentType = 'flight_ticket' | 'hotel_voucher' | 'qr_code' | 'memo' | 'other';

export interface VaultDocument {
  id: string;
  tripId: string;
  type: VaultDocumentType;
  title: string;
  fileUrl?: string; // PDF/이미지 등 첨부파일 (Supabase Storage URL) — 오프라인 메모는 없음
  fileMimeType?: string;
  memoText?: string; // 오프라인 메모 본문 (인터넷 없이도 로컬 캐시로 확인 가능)
  createdBy: string;
  createdAt: string; // ISO datetime
}

/** 템플릿에 저장되는 섹션 구조 — 특정 여행/가방의 구체적인 id에 묶이지 않은 재사용 가능한 형태 */
export interface PackTemplateSection {
  kind: SectionKind;
  name: string;
  icon: string;
  baggageMode: BaggageMode;
  isCustom: boolean;
}

/** 템플릿에 저장되는 물품 — 섹션은 id 대신 이름으로 참조해, 적용 시 새 섹션에 다시 매칭한다 */
export interface PackTemplateItem {
  sectionName: string;
  name: string;
  emoji: string;
  restriction: RestrictionCategory;
  isEssential: boolean;
  quantity: number;
}

/** "3박4일 일본여행 템플릿" 등으로 저장해두고 다음 여행에 그대로 불러오는 패킹 리스트 스냅샷 */
export interface PackTemplate {
  id: string;
  name: string;
  bagKind: BagKind;
  bagColor: BagColor;
  sections: PackTemplateSection[];
  items: PackTemplateItem[];
  createdAt: string; // ISO datetime
}
