import { ChecklistItem } from '../types/models';

/**
 * "여행 준비 쇼핑 체크리스트" 초기 더미 데이터.
 * affiliateUrl은 실제 쿠팡 파트너스 등 제휴 링크로 교체하기 전까지의 플레이스홀더다.
 */
export const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'chk-adapter',
    title: '멀티 어댑터',
    category: '전자기기',
    isCompleted: false,
    dDayCategory: 'D-14',
    affiliateInfo: {
      productName: '해외여행용 멀티 어댑터',
      price: '12,900원',
      affiliateUrl: 'https://example.com/affiliate/multi-adapter',
    },
  },
  {
    id: 'chk-battery',
    title: '보조배터리',
    category: '전자기기',
    isCompleted: false,
    dDayCategory: 'D-14',
    affiliateInfo: {
      productName: '20000mAh 고속충전 보조배터리',
      price: '29,900원',
      affiliateUrl: 'https://example.com/affiliate/power-bank',
    },
  },
  {
    id: 'chk-liquid-bottle',
    title: '100ml 이하 소분 용기',
    category: '세면도구',
    isCompleted: false,
    dDayCategory: 'D-7',
    affiliateInfo: {
      productName: '기내반입용 소분 용기 세트',
      price: '8,500원',
      affiliateUrl: 'https://example.com/affiliate/travel-bottles',
    },
  },
  {
    id: 'chk-packing-cube',
    title: '여행용 압축 파우치',
    category: '의류',
    isCompleted: false,
    dDayCategory: 'D-7',
    affiliateInfo: {
      productName: '캐리어 압축 정리 파우치 4종 세트',
      price: '15,900원',
      affiliateUrl: 'https://example.com/affiliate/packing-cubes',
    },
  },
  {
    id: 'chk-passport-check',
    title: '여권 유효기간 확인하기',
    category: '서류',
    isCompleted: false,
    dDayCategory: 'D-30',
    // 구매가 필요한 물건이 아니므로 affiliateInfo 없음 — 리스트에 구매 버튼이 안 뜨는 걸 보여주는 예시
  },
];
