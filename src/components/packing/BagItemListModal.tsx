import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bag, PackItem } from '../../types/models';

interface Props {
  visible: boolean;
  bag: Bag;
  items: PackItem[];
  onClose: () => void;
  onToggleChecked: (itemId: string) => void;
}

/** 가방 속 물품을 구역별로 한 화면에서 모아 보는 전체 목록 — 섹션을 하나씩 열어보지 않아도 된다 */
export function BagItemListModal({ visible, bag, items, onClose, onToggleChecked }: Props) {
  const itemsBySection = bag.sections.map((section) => ({
    section,
    items: items.filter((i) => i.sectionId === section.id),
  }));
  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>📋 {bag.label} 전체 물품</Text>
              <Text style={styles.subtitle}>{checkedCount}/{totalCount}개 챙김</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {itemsBySection.map(({ section, items: sectionItems }) => (
              <View key={section.id} style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>
                  {section.icon} {section.name} ({sectionItems.filter((i) => i.checked).length}/{sectionItems.length})
                </Text>
                {sectionItems.length === 0 ? (
                  <Text style={styles.emptyText}>아직 담은 물건이 없어요</Text>
                ) : (
                  sectionItems.map((item) => (
                    <Pressable key={item.id} style={styles.itemRow} onPress={() => onToggleChecked(item.id)}>
                      <Text style={styles.checkMark}>{item.checked ? '✅' : '⬜️'}</Text>
                      <Text style={styles.itemEmoji}>{item.emoji}</Text>
                      <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={1}>
                        {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                      </Text>
                      {item.isEssential && <Text style={styles.essentialMark}>⭐</Text>}
                    </Pressable>
                  ))
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FBF7F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingTop: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#2A2A2E' },
  subtitle: { fontSize: 12, color: '#8A8A8E', marginTop: 2 },
  closeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F1EC', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 13, fontWeight: '700', color: '#4A4A4E' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  sectionBlock: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#2A2A2E' },
  emptyText: { fontSize: 12, color: '#B0B0B4' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkMark: { fontSize: 16 },
  itemEmoji: { fontSize: 16 },
  itemName: { flex: 1, fontSize: 13, color: '#2A2A2E' },
  itemNameChecked: { color: '#B0B0B4', textDecorationLine: 'line-through' },
  essentialMark: { fontSize: 12 },
});
