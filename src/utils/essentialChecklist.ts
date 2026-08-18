import { Bag, PackItem } from '../types/models';

export interface EssentialRow {
  item: PackItem;
  ownerName: string; // 이 품목이 들어있는 가방의 소유자 (짐을 싸는 사람 기준)
  bagLabel: string;
  sectionName: string;
}

/** 모든 가방을 가로질러 isEssential=true 품목만 모아, 출발 전 체크 화면에서 한눈에 보여준다 */
export function collectEssentialItems(bags: Bag[], items: PackItem[]): EssentialRow[] {
  const rows: EssentialRow[] = [];
  for (const bag of bags) {
    for (const section of bag.sections) {
      for (const item of items) {
        if (item.sectionId !== section.id || !item.isEssential) continue;
        rows.push({ item, ownerName: bag.ownerName, bagLabel: bag.label, sectionName: section.name });
      }
    }
  }
  return rows;
}

export function countUncheckedEssentials(rows: EssentialRow[]): number {
  return rows.filter((r) => !r.item.checked).length;
}
