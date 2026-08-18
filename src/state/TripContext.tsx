import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Bag,
  CalendarEvent,
  PackItem,
  PackTemplate,
  StickerPlacement,
  Trip,
  TripMember,
  VaultDocument,
} from '../types/models';
import { collectEssentialItems, countUncheckedEssentials } from '../utils/essentialChecklist';
import { expandTemplateSections } from '../utils/templateBuilder';
import { scheduleDepartureReminders } from '../notifications/departureReminders';

/** 이 기기를 쓰고 있는 "나"를 가리키는 표시명. 실서비스에서는 로그인 세션의 표시명으로 대체된다. */
export const CURRENT_USER_NAME = '나';

/**
 * 화면 간에 공유되는 "현재 여행" 상태.
 * 실제 서비스에서는 각 필드가 Supabase realtime 구독(가족·친구 크루 동기화)으로 대체되지만,
 * 네비게이션 구조를 보여주기 위한 이 스캐폴드에서는 인메모리 mock 데이터로 시작해
 * 모든 탭(짐싸기/검색/캘린더/보관함/출발체크)이 동일한 여행·가방을 바라보도록 한다.
 */
interface TripContextValue {
  trip: Trip;
  bags: Bag[];
  items: PackItem[];
  events: CalendarEvent[];
  documents: VaultDocument[];
  members: TripMember[];
  updateBagDecoration: (bagId: string, color: Bag['decoration']['color'], placements: StickerPlacement[]) => void;
  updateBagWeightLimit: (bagId: string, weightLimitKg: number) => void;
  applyTemplateToBag: (bagId: string, template: PackTemplate) => void;
  setItems: React.Dispatch<React.SetStateAction<PackItem[]>>;
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<VaultDocument[]>>;
  setMembers: React.Dispatch<React.SetStateAction<TripMember[]>>;
}

const TripContext = createContext<TripContextValue | null>(null);

const MOCK_TRIP: Trip = {
  id: 'trip-1',
  familyId: 'family-1',
  name: '가족 오사카 여행',
  destinationCountry: 'JP',
  destinationCity: '오사카',
  lat: 34.6937,
  lon: 135.5023,
  season: 'winter',
  startDate: '2026-09-20',
  endDate: '2026-09-24',
  inviteCode: 'AB12CD',
};

function createInitialBags(): Bag[] {
  const bagId = 'bag-1';
  return [
    {
      id: bagId,
      tripId: MOCK_TRIP.id,
      ownerName: '엄마',
      kind: 'carryon24',
      label: '엄마 24인치 캐리어',
      decoration: { bagId, color: 'pastel_pink', placements: [] },
      weightLimitKg: 23,
      sections: [
        { id: 'sec-left', bagId, kind: 'main-left', name: '왼쪽 메인', icon: '👕', baggageMode: 'checked', isCustom: false },
        { id: 'sec-right', bagId, kind: 'main-right', name: '오른쪽 메인', icon: '👖', baggageMode: 'checked', isCustom: false },
        { id: 'sec-hidden', bagId, kind: 'hidden-pocket', name: '히든포켓', icon: '🤫', baggageMode: 'carryOn', isCustom: false },
        {
          id: 'sec-essentials',
          bagId,
          kind: 'custom',
          name: '필수 지참품',
          icon: '🛂',
          baggageMode: 'carryOn',
          isCustom: true,
        },
      ],
    },
  ];
}

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    tripId: MOCK_TRIP.id,
    date: MOCK_TRIP.startDate,
    time: '09:20',
    title: '인천 -> 간사이 출발편 (KE723)',
    category: 'flight',
    createdBy: CURRENT_USER_NAME,
  },
  {
    id: 'evt-2',
    tripId: MOCK_TRIP.id,
    date: MOCK_TRIP.startDate,
    time: '15:00',
    title: '호텔 체크인',
    category: 'hotel',
    createdBy: CURRENT_USER_NAME,
  },
];

/** 가족과 친구가 섞여 있는 여행 크루 예시 — relation으로만 구분하고 권한 차이는 없다 */
const INITIAL_MEMBERS: TripMember[] = [
  { id: 'mem-me', tripId: MOCK_TRIP.id, displayName: CURRENT_USER_NAME, relation: 'me', joinedAt: '2026-08-01T00:00:00Z' },
  { id: 'mem-mom', tripId: MOCK_TRIP.id, displayName: '엄마', relation: 'family', joinedAt: '2026-08-01T00:10:00Z' },
  { id: 'mem-dad', tripId: MOCK_TRIP.id, displayName: '아빠', relation: 'family', joinedAt: '2026-08-01T00:12:00Z' },
  { id: 'mem-friend', tripId: MOCK_TRIP.id, displayName: '민지', relation: 'friend', joinedAt: '2026-08-05T09:30:00Z' },
];

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [bags, setBags] = useState<Bag[]>(createInitialBags);
  const [items, setItems] = useState<PackItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [members, setMembers] = useState<TripMember[]>(INITIAL_MEMBERS);

  const updateBagDecoration: TripContextValue['updateBagDecoration'] = (bagId, color, placements) => {
    setBags((prev) =>
      prev.map((b) => (b.id === bagId ? { ...b, decoration: { ...b.decoration, color, placements } } : b))
    );
  };

  const updateBagWeightLimit: TripContextValue['updateBagWeightLimit'] = (bagId, weightLimitKg) => {
    setBags((prev) => prev.map((b) => (b.id === bagId ? { ...b, weightLimitKg } : b)));
  };

  /** ④ 템플릿을 가방에 적용 — 섹션 구조를 새 id로 다시 만들고, 옛 섹션에 있던 물품은 정리한 뒤 템플릿 물품으로 채운다 */
  const applyTemplateToBag: TripContextValue['applyTemplateToBag'] = (bagId, template) => {
    const targetBag = bags.find((b) => b.id === bagId);
    if (!targetBag) return;

    const oldSectionIds = new Set(targetBag.sections.map((s) => s.id));
    const newSections = expandTemplateSections(template, bagId);
    const sectionIdByName = new Map(newSections.map((s) => [s.name, s.id]));

    setBags((prev) =>
      prev.map((b) =>
        b.id === bagId
          ? { ...b, kind: template.bagKind, decoration: { ...b.decoration, color: template.bagColor }, sections: newSections }
          : b
      )
    );

    const newItems: PackItem[] = template.items.map((templateItem, index) => ({
      id: `tpl-item-${index}-${Date.now()}`,
      sectionId: sectionIdByName.get(templateItem.sectionName) ?? newSections[0].id,
      name: templateItem.name,
      emoji: templateItem.emoji,
      checked: false,
      quantity: templateItem.quantity,
      restriction: templateItem.restriction,
      createdBy: CURRENT_USER_NAME,
      isEssential: templateItem.isEssential,
      confirmedBy: [],
    }));

    setItems((prev) => [...prev.filter((item) => !oldSectionIds.has(item.sectionId)), ...newItems]);
  };

  // ③ items/bags가 바뀔 때마다 "출발 D-1/D-Day 필수품 미챙김" 알림을 최신 개수로 다시 예약한다.
  useEffect(() => {
    const rows = collectEssentialItems(bags, items);
    const unchecked = countUncheckedEssentials(rows);
    scheduleDepartureReminders(MOCK_TRIP, unchecked).catch(() => {
      // 알림 권한이 없거나 플랫폼 미지원이면 조용히 무시 (필수 기능이 아님)
    });
  }, [bags, items]);

  const value = useMemo<TripContextValue>(
    () => ({
      trip: MOCK_TRIP,
      bags,
      items,
      events,
      documents,
      members,
      updateBagDecoration,
      updateBagWeightLimit,
      applyTemplateToBag,
      setItems,
      setEvents,
      setDocuments,
      setMembers,
    }),
    [bags, items, events, documents, members]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext는 TripProvider 내부에서만 사용할 수 있어요.');
  return ctx;
}
