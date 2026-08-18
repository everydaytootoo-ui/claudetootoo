import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BAG_COLOR_HEX, Bag, BagSection, PackItem, SectionSlot } from '../../types/models';
import { validateBaggagePlacement } from '../../utils/baggageRules';

interface Props {
  bag: Bag;
  items: PackItem[];
  onToggleChecked: (itemId: string) => void;
  /** 구역 헤더 또는 "+" 칩을 탭하면 상세 체크리스트 바텀시트를 연다 (추가/사진/이름수정/삭제는 거기서) */
  onOpenSection: (section: BagSection) => void;
  /** 빈 자리를 탭했을 때(slot 지정) 또는 "기타 구역 추가" 칩을 탭했을 때(slot 없음) 새 구역 모달을 연다 */
  onAddSectionPress: (presetSlot?: SectionSlot | null) => void;
}

/**
 * 캐리어를 연 것처럼 그려서 보여주는 내부 뷰.
 * 왼쪽/오른쪽 큰 칸 + 위/아래 작은 포켓, 총 4자리(slot)에 유저가 원하는 구역을 직접 배정한다.
 * 자리가 없는(slot: null) 구역은 그림 아래 "기타 구역" 칩으로 내려가고, "펼쳐보기"로 그림 전체를 키워
 * 양쪽으로 펼쳐진 캐리어를 더 크고 편하게 볼 수 있다.
 */
export function BagInteriorView({ bag, items, onToggleChecked, onOpenSection, onAddSectionPress }: Props) {
  const [expanded, setExpanded] = useState(false);

  const bySlot = (slot: SectionSlot): BagSection | undefined => bag.sections.find((s) => s.slot === slot);
  const overflowSections = bag.sections.filter((s) => s.slot == null);
  const liningColor = BAG_COLOR_HEX[bag.decoration.color];

  const itemsFor = (section: BagSection | undefined) =>
    section ? items.filter((i) => i.sectionId === section.id) : [];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>🧳 가방 속</Text>
        <Pressable style={styles.expandBtn} onPress={() => setExpanded((e) => !e)}>
          <Text style={styles.expandBtnText}>{expanded ? '접기 ▲' : '펼쳐보기 ▼'}</Text>
        </Pressable>
      </View>

      <View style={[styles.caseBody, { backgroundColor: withAlpha(liningColor, 0.28) }]}>
        <View style={[styles.mainRow, expanded && styles.mainRowExpanded]}>
          <Zone
            section={bySlot('left')}
            items={itemsFor(bySlot('left'))}
            expanded={expanded}
            size="main"
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
            onEmptyPress={() => onAddSectionPress('left')}
          />
          <View style={styles.seam}>
            <View style={styles.seamLine} />
            <View style={styles.seamPull} />
            <View style={styles.seamLine} />
          </View>
          <Zone
            section={bySlot('right')}
            items={itemsFor(bySlot('right'))}
            expanded={expanded}
            size="main"
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
            onEmptyPress={() => onAddSectionPress('right')}
          />
        </View>

        <View style={styles.pocketRow}>
          <Zone
            section={bySlot('pocket-top')}
            items={itemsFor(bySlot('pocket-top'))}
            expanded={expanded}
            size="pocket"
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
            onEmptyPress={() => onAddSectionPress('pocket-top')}
          />
          <Zone
            section={bySlot('pocket-bottom')}
            items={itemsFor(bySlot('pocket-bottom'))}
            expanded={expanded}
            size="pocket"
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
            onEmptyPress={() => onAddSectionPress('pocket-bottom')}
          />
        </View>
      </View>

      {overflowSections.length > 0 && (
        <View style={styles.overflowRow}>
          {overflowSections.map((section) => {
            const total = itemsFor(section).length;
            const checked = itemsFor(section).filter((i) => i.checked).length;
            return (
              <Pressable key={section.id} style={styles.overflowChip} onPress={() => onOpenSection(section)}>
                <Text style={styles.overflowChipText}>
                  {section.icon} {section.name} · {checked}/{total}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable style={styles.addSectionLink} onPress={() => onAddSectionPress(null)}>
        <Text style={styles.addSectionLinkText}>+ 기타 구역 추가</Text>
      </Pressable>
    </View>
  );
}

interface ZoneProps {
  section: BagSection | undefined;
  items: PackItem[];
  expanded: boolean;
  size: 'main' | 'pocket';
  onToggleChecked: (itemId: string) => void;
  onOpenSection: (section: BagSection) => void;
  onEmptyPress: () => void;
}

function Zone({ section, items, expanded, size, onToggleChecked, onOpenSection, onEmptyPress }: ZoneProps) {
  const minHeight = size === 'main' ? (expanded ? 220 : 130) : expanded ? 110 : 74;
  const chipSize = expanded ? 48 : size === 'main' ? 40 : 34;

  if (!section) {
    return (
      <Pressable style={[styles.zone, styles.zoneEmpty, { minHeight }]} onPress={onEmptyPress}>
        <Text style={styles.zoneEmptyText}>+ 구역 놓기</Text>
      </Pressable>
    );
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Pressable style={[styles.zone, { minHeight }]} onPress={() => onOpenSection(section)}>
      <View style={styles.zoneHeader}>
        <Text style={[styles.zoneTitle, expanded && styles.zoneTitleExpanded]} numberOfLines={1}>
          {section.icon} {section.name}
        </Text>
        <Text style={styles.zoneCount}>
          {checkedCount}/{items.length}
        </Text>
      </View>

      <View style={styles.itemGrid}>
        {items.map((item) => {
          const warning = validateBaggagePlacement(item.restriction, section.baggageMode);
          return (
            <Pressable
              key={item.id}
              style={[
                styles.itemChip,
                { width: chipSize, height: chipSize, borderRadius: chipSize / 2 },
                !item.checked && styles.itemChipUnpacked,
              ]}
              onPress={() => onToggleChecked(item.id)}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.itemPhoto} />
              ) : (
                <Text style={{ fontSize: chipSize * 0.46 }}>{item.emoji}</Text>
              )}
              {item.checked && (
                <View style={styles.checkedBadge}>
                  <Text style={styles.checkedBadgeText}>✓</Text>
                </View>
              )}
              {item.isEssential && (
                <View style={styles.essentialDot}>
                  <Text style={styles.essentialDotText}>⭐</Text>
                </View>
              )}
              {warning.level !== 'none' && (
                <View
                  style={[styles.warnDot, warning.level === 'danger' ? styles.warnDotDanger : styles.warnDotCaution]}
                />
              )}
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.addItemChip, { width: chipSize, height: chipSize, borderRadius: chipSize / 2 }]}
          onPress={() => onOpenSection(section)}
        >
          <Text style={styles.addItemChipText}>+</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** 헥사 컬러에 알파를 섞어 은은한 안감 색을 만든다 (외부 라이브러리 없이 rgba 변환) */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    gap: 12,
    shadowColor: '#2A2A2E',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#2A2A2E' },
  expandBtn: { backgroundColor: '#F3F1EC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  expandBtnText: { fontSize: 11, fontWeight: '700', color: '#8A6D4A' },
  caseBody: { borderRadius: 22, padding: 10, gap: 8 },
  mainRow: { flexDirection: 'row', alignItems: 'stretch', gap: 4 },
  mainRowExpanded: { gap: 6 },
  seam: { width: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  seamLine: { width: 2, flex: 1, borderRadius: 1, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(42,42,46,0.18)' },
  seamPull: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(42,42,46,0.18)' },
  pocketRow: { flexDirection: 'row', gap: 8 },
  zone: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    gap: 6,
  },
  zoneEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(42,42,46,0.22)',
  },
  zoneEmptyText: { fontSize: 12, fontWeight: '700', color: 'rgba(42,42,46,0.4)' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneTitle: { fontSize: 12, fontWeight: '800', color: '#2A2A2E', flexShrink: 1 },
  zoneTitleExpanded: { fontSize: 13 },
  zoneCount: { fontSize: 10, color: '#B0B0B4', fontWeight: '700' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemChip: {
    backgroundColor: '#F8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  itemChipUnpacked: { opacity: 0.4 },
  itemPhoto: { width: '100%', height: '100%', borderRadius: 999 },
  checkedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#3FB27F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '800' },
  essentialDot: { position: 'absolute', top: -6, left: -6 },
  essentialDotText: { fontSize: 12 },
  warnDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  warnDotCaution: { backgroundColor: '#F2B705' },
  warnDotDanger: { backgroundColor: '#E5484D' },
  addItemChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DFD3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemChipText: { fontSize: 16, color: '#B0B0B4', fontWeight: '700' },
  overflowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overflowChip: { backgroundColor: '#F3F1EC', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  overflowChipText: { fontSize: 11, fontWeight: '700', color: '#4A4A4E' },
  addSectionLink: { alignSelf: 'center', paddingVertical: 4 },
  addSectionLinkText: { fontSize: 12, fontWeight: '700', color: '#FF8A5B' },
});
