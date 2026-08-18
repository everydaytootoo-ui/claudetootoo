import React, { forwardRef, useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { BagSection, PackItem } from '../../types/models';
import { QuickPickItem } from '../../data/quickPickCatalog';
import { guessRestrictionCategory } from '../../data/restrictedItems';
import { collectBaggageWarnings, validateBaggagePlacement } from '../../utils/baggageRules';
import { QuickPickBar } from './QuickPickBar';

interface Props {
  section: BagSection | null;
  items: PackItem[];
  onToggleChecked: (itemId: string) => void;
  onAddQuickPickItem: (section: BagSection, quickPick: QuickPickItem) => void;
  onAttachPhoto: (itemId: string, localUri: string) => void;
  onRemoveItem: (itemId: string) => void;
}

/**
 * ② 가방/섹션 클릭 시 열리는 '체크리스트 + 실물 사진 미리보기' 하단 시트.
 * - 상단: 이모지 퀵-픽 바로 현재 섹션에 바로 물품 추가
 * - 본문: 체크리스트(체크박스) + 실물 사진 썸네일, 위탁/기내 규정 위반 시 경고 배지
 */
export const BagSectionSheet = forwardRef<BottomSheet, Props>(function BagSectionSheet(
  { section, items, onToggleChecked, onAddQuickPickItem, onAttachPhoto, onRemoveItem },
  ref
) {
  const snapPoints = useMemo(() => ['45%', '85%'], []);
  const warnings = useMemo(
    () => (section ? collectBaggageWarnings(items, section.baggageMode) : []),
    [items, section]
  );

  const handlePick = useCallback(
    (quickPick: QuickPickItem) => {
      if (section) onAddQuickPickItem(section, quickPick);
    },
    [section, onAddQuickPickItem]
  );

  const pickPhoto = useCallback(
    async (itemId: string) => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        onAttachPhoto(itemId, result.assets[0].uri);
      }
    },
    [onAttachPhoto]
  );

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView style={styles.header}>
        <Text style={styles.title}>
          {section ? `${section.icon} ${section.name}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          {section?.baggageMode === 'checked' ? '🧳 위탁 수하물 구역' : '🎒 기내 반입 구역'}
        </Text>
        <QuickPickBar onPick={handlePick} />
      </BottomSheetView>

      {warnings.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ 이 구역에 반입 주의 품목이 {warnings.length}개 있어요. 아래에서 확인해주세요.
          </Text>
        </View>
      )}

      <BottomSheetFlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const validation = section
            ? validateBaggagePlacement(item.restriction, section.baggageMode)
            : { level: 'none' as const, message: null };
          return (
            <View style={styles.row}>
              <Pressable style={styles.checkbox} onPress={() => onToggleChecked(item.id)}>
                <Text style={styles.checkboxMark}>{item.checked ? '✅' : '⬜️'}</Text>
              </Pressable>

              <Pressable style={styles.photoThumb} onPress={() => pickPhoto(item.id)}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                ) : (
                  <Text style={styles.photoPlaceholder}>{item.emoji}</Text>
                )}
              </Pressable>

              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                  {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                </Text>
                {validation.level !== 'none' && (
                  <View
                    style={[
                      styles.badge,
                      validation.level === 'danger' ? styles.badgeDanger : styles.badgeWarning,
                    ]}
                  >
                    <Text style={styles.badgeText}>{validation.message}</Text>
                  </View>
                )}
              </View>

              <Pressable onPress={() => onRemoveItem(item.id)} hitSlop={8}>
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>아직 챙긴 물건이 없어요. 위 퀵-픽에서 추가해보세요!</Text>
        }
      />
    </BottomSheet>
  );
});

/** 이름 기반으로 제한 카테고리를 즉시 추정해 PackItem 초안을 만들 때 사용하는 헬퍼 */
export function buildPackItemDraft(section: BagSection, quickPick: QuickPickItem, createdBy: string) {
  return {
    sectionId: section.id,
    name: quickPick.name,
    emoji: quickPick.emoji,
    checked: false,
    quantity: 1,
    restriction: quickPick.restriction ?? guessRestrictionCategory(quickPick.name),
    createdBy,
  };
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#2A2A2E' },
  subtitle: { fontSize: 12, color: '#8A8A8E', marginBottom: 8 },
  warningBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFF1E6',
  },
  warningText: { fontSize: 12, color: '#C1560B', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { padding: 4 },
  checkboxMark: { fontSize: 20 },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 20 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, color: '#2A2A2E', fontWeight: '500' },
  itemNameChecked: { color: '#B0B0B4', textDecorationLine: 'line-through' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeWarning: { backgroundColor: '#FFF1E6' },
  badgeDanger: { backgroundColor: '#FDE2E1' },
  badgeText: { fontSize: 10, color: '#7A2E27' },
  removeText: { fontSize: 12, color: '#B0B0B4' },
  emptyText: { textAlign: 'center', color: '#B0B0B4', marginTop: 24, fontSize: 13 },
});
