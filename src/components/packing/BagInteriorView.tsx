import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bag, BagSection, PackItem } from '../../types/models';
import { validateBaggagePlacement } from '../../utils/baggageRules';

interface Props {
  bag: Bag;
  items: PackItem[];
  onToggleChecked: (itemId: string) => void;
  /** 구역 헤더 또는 "+" 칩을 탭하면 상세 체크리스트 바텀시트를 연다 (추가/사진/삭제는 거기서) */
  onOpenSection: (section: BagSection) => void;
  onAddSectionPress: () => void;
}

/**
 * 캐리어를 연 것처럼 크게 보여주는 내부 뷰.
 * 왼쪽/오른쪽 메인은 큰 구역으로, 히든포켓·필수품 등 나머지는 작은 포켓으로 배치하고,
 * 각 물품은 탭 한 번으로 체크(넣음/뺌)를 바로 바꿀 수 있다 — 상세 추가·사진은 구역을 열어서.
 */
export function BagInteriorView({ bag, items, onToggleChecked, onOpenSection, onAddSectionPress }: Props) {
  const mainSections = bag.sections.filter((s) => s.kind === 'main-left' || s.kind === 'main-right');
  const pocketSections = bag.sections.filter((s) => s.kind !== 'main-left' && s.kind !== 'main-right');

  return (
    <View style={styles.suitcase}>
      <View style={styles.mainRow}>
        {mainSections.map((section) => (
          <Zone
            key={section.id}
            section={section}
            items={items.filter((i) => i.sectionId === section.id)}
            large
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
          />
        ))}
      </View>

      <View style={styles.pocketRow}>
        {pocketSections.map((section) => (
          <Zone
            key={section.id}
            section={section}
            items={items.filter((i) => i.sectionId === section.id)}
            large={false}
            onToggleChecked={onToggleChecked}
            onOpenSection={onOpenSection}
          />
        ))}
        <Pressable style={styles.addSectionTile} onPress={onAddSectionPress}>
          <Text style={styles.addSectionText}>+ 구역{'\n'}추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface ZoneProps {
  section: BagSection;
  items: PackItem[];
  large: boolean;
  onToggleChecked: (itemId: string) => void;
  onOpenSection: (section: BagSection) => void;
}

function Zone({ section, items, large, onToggleChecked, onOpenSection }: ZoneProps) {
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <View style={[styles.zone, large ? styles.zoneLarge : styles.zoneSmall]}>
      <Pressable style={styles.zoneHeader} onPress={() => onOpenSection(section)}>
        <Text style={styles.zoneTitle} numberOfLines={1}>
          {section.icon} {section.name}
        </Text>
        <Text style={styles.zoneCount}>
          {checkedCount}/{items.length}
        </Text>
      </Pressable>

      <View style={styles.itemGrid}>
        {items.map((item) => {
          const warning = validateBaggagePlacement(item.restriction, section.baggageMode);
          return (
            <Pressable
              key={item.id}
              style={[styles.itemChip, !item.checked && styles.itemChipUnpacked]}
              onPress={() => onToggleChecked(item.id)}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.itemPhoto} />
              ) : (
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
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
                <View style={[styles.warnDot, warning.level === 'danger' ? styles.warnDotDanger : styles.warnDotCaution]} />
              )}
            </Pressable>
          );
        })}

        <Pressable style={styles.addItemChip} onPress={() => onOpenSection(section)}>
          <Text style={styles.addItemChipText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  suitcase: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  mainRow: { flexDirection: 'row', gap: 10 },
  pocketRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  zone: { backgroundColor: '#F8F5EE', borderRadius: 18, padding: 10, gap: 8 },
  zoneLarge: { flex: 1, minHeight: 150 },
  zoneSmall: { width: '31%' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneTitle: { fontSize: 12, fontWeight: '700', color: '#2A2A2E', flexShrink: 1 },
  zoneCount: { fontSize: 10, color: '#B0B0B4', fontWeight: '600' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  itemChipUnpacked: { opacity: 0.45 },
  itemPhoto: { width: '100%', height: '100%', borderRadius: 12 },
  itemEmoji: { fontSize: 20 },
  checkedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3FB27F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '800' },
  essentialDot: { position: 'absolute', top: -4, left: -4 },
  essentialDotText: { fontSize: 11 },
  warnDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  warnDotCaution: { backgroundColor: '#F2B705' },
  warnDotDanger: { backgroundColor: '#E5484D' },
  addItemChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DFD3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemChipText: { fontSize: 16, color: '#B0B0B4', fontWeight: '700' },
  addSectionTile: {
    width: '31%',
    minHeight: 60,
    backgroundColor: '#F3F1EC',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSectionText: { fontSize: 11, fontWeight: '700', color: '#8A8A8E', textAlign: 'center' },
});
