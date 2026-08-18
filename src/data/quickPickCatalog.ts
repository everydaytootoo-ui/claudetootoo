import { RestrictionCategory } from '../types/models';

export interface QuickPickItem {
  id: string;
  emoji: string;
  name: string;
  restriction: RestrictionCategory;
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
  { id: 'passport', emoji: '🛂', name: '여권', restriction: 'none' },
  { id: 'umbrella', emoji: '☂️', name: '우산', restriction: 'none' },
  { id: 'scissors', emoji: '✂️', name: '휴대용 가위', restriction: 'sharp_object' },
  { id: 'sunscreen_spray', emoji: '🧴', name: '선크림 스프레이', restriction: 'aerosol' },
  { id: 'earphones', emoji: '🎧', name: '이어폰/헤드폰', restriction: 'none' },
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
