import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bag, BagKind } from '../../types/models';
import { BAG_KIND_ICON, BAG_KIND_LABEL, BAG_KIND_OPTIONS } from '../../data/bagKinds';

interface Props {
  bags: Bag[];
  selectedBagId: string;
  onSelect: (bagId: string) => void;
  /** 생략하면 전환 전용(읽기 화면)으로 동작하고 "+ 가방 추가" 칩을 숨긴다 */
  onAddBag?: (ownerName: string, kind: BagKind) => void;
  /** 생략하거나 가방이 하나뿐이면 삭제(✕) 배지를 숨긴다 — 가방은 최소 1개는 남아야 한다 */
  onDeleteBag?: (bagId: string) => void;
}

/** 여러 가방(가족·친구별 캐리어/백팩)을 가로 칩으로 전환 + (선택) "+"로 새 가방 추가/✕로 삭제 */
export function BagSwitcher({ bags, selectedBagId, onSelect, onAddBag, onDeleteBag }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [kind, setKind] = useState<BagKind>('carryon24');

  // 가방이 하나뿐이고 추가할 수도 없는 화면(템플릿/출발체크)이면 전환기 자체를 숨겨 화면을 단순하게 유지한다.
  if (bags.length <= 1 && !onAddBag) return null;

  const handleAdd = () => {
    if (!onAddBag) return;
    // 이름을 안 적어도 종류 선택만으로 추가되게 — 비워두면 가방 종류 이름으로 대신 채운다
    onAddBag(ownerName.trim() || BAG_KIND_LABEL[kind], kind);
    setOwnerName('');
    setKind('carryon24');
    setModalVisible(false);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {bags.map((bag) => {
          const selected = bag.id === selectedBagId;
          return (
            <View key={bag.id} style={styles.chipWrap}>
              <Pressable
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onSelect(bag.id)}
              >
                <Text style={styles.chipIcon}>{BAG_KIND_ICON[bag.kind]}</Text>
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} numberOfLines={1}>
                  {bag.ownerName}
                </Text>
              </Pressable>
              {onDeleteBag && bags.length > 1 && (
                <Pressable
                  style={styles.removeBadge}
                  onPress={() => onDeleteBag(bag.id)}
                  hitSlop={6}
                  accessibilityLabel={`${bag.ownerName} 가방 삭제`}
                >
                  <Text style={styles.removeBadgeText}>✕</Text>
                </Pressable>
              )}
            </View>
          );
        })}
        {onAddBag && (
          <Pressable style={styles.addChip} onPress={() => setModalVisible(true)}>
            <Text style={styles.addChipText}>+ 가방 추가</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={modalVisible && !!onAddBag} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>새 가방 추가</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="누구의 가방인가요? (예: 아빠, 민지)"
              value={ownerName}
              onChangeText={setOwnerName}
            />
            <View style={styles.kindRow}>
              {BAG_KIND_OPTIONS.map((k) => (
                <Pressable
                  key={k}
                  style={[styles.kindChip, kind === k && styles.kindChipSelected]}
                  onPress={() => setKind(k)}
                >
                  <Text style={styles.kindChipIcon}>{BAG_KIND_ICON[k]}</Text>
                  <Text style={[styles.kindChipLabel, kind === k && styles.kindChipLabelSelected]}>
                    {BAG_KIND_LABEL[k]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleAdd}>
                <Text style={styles.modalSaveText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  chipWrap: { position: 'relative' },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2A2A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: { backgroundColor: '#2A2A2E' },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 12, fontWeight: '700', color: '#4A4A4E' },
  chipLabelSelected: { color: '#FFFFFF' },
  addChip: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F3F1EC',
  },
  addChipText: { fontSize: 12, fontWeight: '700', color: '#8A8A8E' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  modalInput: {
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F1EC',
  },
  kindChipSelected: { backgroundColor: '#FDE9DD' },
  kindChipIcon: { fontSize: 14 },
  kindChipLabel: { fontSize: 11, color: '#4A4A4E', fontWeight: '600' },
  kindChipLabelSelected: { color: '#C1560B' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 8 },
  modalCancelText: { color: '#8A8A8E', fontSize: 13 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 10 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
