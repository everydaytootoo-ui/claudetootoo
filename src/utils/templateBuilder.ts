import { Bag, BagSection, PackItem, PackTemplate } from '../types/models';

/** 현재 가방의 색상·구역 구조·물품 구성을 이름 기반의 재사용 가능한 템플릿으로 직렬화한다 */
export function buildTemplateFromBag(bag: Bag, items: PackItem[], name: string): PackTemplate {
  const bagSectionIds = new Set(bag.sections.map((s) => s.id));
  const bagItems = items.filter((item) => bagSectionIds.has(item.sectionId));
  const sectionById = new Map(bag.sections.map((s) => [s.id, s]));

  return {
    id: `tpl-${Date.now()}`,
    name,
    bagKind: bag.kind,
    bagColor: bag.decoration.color,
    sections: bag.sections.map((s) => ({
      kind: s.kind,
      name: s.name,
      icon: s.icon,
      baggageMode: s.baggageMode,
      isCustom: s.isCustom,
    })),
    items: bagItems.map((item) => {
      const section = sectionById.get(item.sectionId) as BagSection;
      return {
        sectionName: section.name,
        name: item.name,
        emoji: item.emoji,
        restriction: item.restriction,
        isEssential: item.isEssential,
        quantity: item.quantity,
      };
    }),
    createdAt: new Date().toISOString(),
  };
}

/** 템플릿의 섹션 구조를 특정 가방(bagId)에 붙일 새 BagSection[]으로 펼친다 (id는 새로 발급) */
export function expandTemplateSections(template: PackTemplate, bagId: string): BagSection[] {
  return template.sections.map((section, index) => ({
    id: `tpl-sec-${index}-${Date.now()}`,
    bagId,
    kind: section.kind,
    name: section.name,
    icon: section.icon,
    baggageMode: section.baggageMode,
    isCustom: section.isCustom,
  }));
}
