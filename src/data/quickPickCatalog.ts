import { RestrictionCategory } from '../types/models';

export interface QuickPickItem {
  id: string;
  emoji: string;
  name: string;
  restriction: RestrictionCategory;
  /** 여권/지갑처럼 놓치면 출발이 막히는 필수 지참품이면 true */
  isEssential?: boolean;
}

/** 이모지 퀵-픽 바에 노출되는 자주 쓰는 여행용품 사전 */
export const QUICK_PICK_CATALOG: QuickPickItem[] = [
  { id: 'plug', emoji: '🔌', name: '돼지코 (멀티어댑터)', restriction: 'none' },
  { id: 'battery', emoji: '🔋', name: '보조배터리', restriction: 'spare_battery' },
  { id: 'meds', emoji: '💊', name: '상비약', restriction: 'none' },
  { id: 'toothbrush', emoji: '🪥', name: '칫솔/치약', restriction: 'liquid_under_100ml' },
  { id: 'lighter', emoji: '🔥', name: '라이터', restriction: 'lighter' },
  { id: 'perfume', emoji: '🧴', name: '스킨/로션', restriction: 'liquid_over_100ml' },
  { id: 'camera', emoji: '📷', name: '카메라', restriction: 'none' },
  { id: 'passport', emoji: '🛂', name: '여권', restriction: 'none', isEssential: true },
  { id: 'umbrella', emoji: '☂️', name: '우산', restriction: 'none' },
  { id: 'scissors', emoji: '✂️', name: '휴대용 가위', restriction: 'sharp_object' },
  { id: 'sunscreen_spray', emoji: '🧴', name: '선크림 스프레이', restriction: 'aerosol' },
  { id: 'earphones', emoji: '🎧', name: '이어폰/헤드폰', restriction: 'none' },
];

/**
 * 출발 직전 "필수 지참품 체크" 화면 전용 퀵-픽.
 * 여권/지갑처럼 가방이 아니라 몸에 지니는 경우가 많은 품목 위주로 구성한다.
 */
export const ESSENTIAL_QUICK_PICKS: QuickPickItem[] = [
  { id: 'passport', emoji: '🛂', name: '여권', restriction: 'none', isEssential: true },
  { id: 'wallet', emoji: '👛', name: '지갑', restriction: 'none', isEssential: true },
  { id: 'id-card', emoji: '🪪', name: '신분증', restriction: 'none', isEssential: true },
  { id: 'e-ticket', emoji: '🎫', name: '항공권(모바일)', restriction: 'none', isEssential: true },
  { id: 'phone-charger', emoji: '🔌', name: '휴대폰 충전기', restriction: 'none', isEssential: true },
  { id: 'travel-insurance', emoji: '📋', name: '여행자보험 서류', restriction: 'none', isEssential: true },
];

/** 여행지 국가/계절에 따른 필수품 자동 추천 */
export const SEASONAL_RECOMMENDATIONS: Record<
  string,
  Partial<Record<'spring' | 'summer' | 'autumn' | 'winter', QuickPickItem[]>>
> = {
  JP: {
    winter: [
      { id: 'jp-adapter', emoji: '🔌', name: '110V 돼지코 어댑터', restriction: 'none' },
      { id: 'hotpack', emoji: '🥵', name: '핫팩', restriction: 'none' },
    ],
  },
};
