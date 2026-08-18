import React, { useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CURRENT_USER_NAME, useTripContext } from '../state/TripContext';
import { collectEssentialItems, countUncheckedEssentials, EssentialRow } from '../utils/essentialChecklist';
import { ESSENTIAL_QUICK_PICKS, QuickPickItem } from '../data/quickPickCatalog';
import { buildPackItemDraft } from '../components/packing/BagSectionSheet';
import { BagSwitcher } from '../components/packing/BagSwitcher';
import { pickItemPhoto } from '../utils/photoPicker';

/**
 * 출발 직전 "필수 지참품" 화면.
 * - 여권/지갑/신분증처럼 놓치면 출발이 막히는 품목만 모아 보여주고
 * - 챙긴 사람이 체크 + 사진(촬영/앨범)을 남기면
 * - 나머지 크루원이 "확인했어요"를 눌러 서로 검증할 수 있다.
 */
export function DepartureCheckInScreen() {
  const { trip, bags, items, setItems, members } = useTripContext();
  const [selectedBagId, setSelectedBagId] = useState(bags[0].id);
  const bag = bags.find((b) => b.id === selectedBagId) ?? bags[0];

  const rows = useMemo(() => collectEssentialItems(bags, items), [bags, items]);
  const uncheckedCount = useMemo(() => countUncheckedEssentials(rows), [rows]);

  const rowsByOwner = useMemo(() => {
    const grouped = new Map<string, EssentialRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.ownerName) ?? [];
      list.push(row);
      grouped.set(row.ownerName, list);
    }
    return Array.from(grouped.entries());
  }, [rows]);

  const essentialsSection = bag.sections.find((s) => s.name === '필수 지참품') ?? bag.sections[0];

  const handleAddEssential = (quickPick: QuickPickItem) => {
    const draft = buildPackItemDraft(essentialsSection, quickPick, CURRENT_USER_NAME);
    setItems((prev) => [...prev, { ...draft, id: `${quickPick.id}-${Date.now()}` }]);
  };

  const toggleChecked = (itemId: string) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
  };

  const attachPhoto = async (itemId: string) => {
    const uri = await pickItemPhoto();
    if (!uri) return;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, photoUrl: uri } : i)));
  };

  const toggleConfirm = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const already = i.confirmedBy.includes(CURRENT_USER_NAME);
        return {
          ...i,
          confirmedBy: already
            ? i.confirmedBy.filter((n) => n !== CURRENT_USER_NAME)
            : [...i.confirmedBy, CURRENT_USER_NAME],
        };
      })
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.banner, uncheckedCount === 0 ? styles.bannerOk : styles.bannerWarning]}>
          <Text style={styles.bannerText}>
            {uncheckedCount === 0
              ? '🎉 필수 지참품을 모두 챙겼어요!'
              : `⚠️ 아직 못 챙긴 필수품이 ${uncheckedCount}개 있어요. 출발 전에 꼭 확인해주세요.`}
          </Text>
        </View>

        <BagSwitcher bags={bags} selectedBagId={bag.id} onSelect={setSelectedBagId} />

        <Text style={styles.sectionLabel}>+ {bag.ownerName}의 필수품 추가</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPickRow}>
          {ESSENTIAL_QUICK_PICKS.map((qp) => (
            <Pressable key={qp.id} style={styles.quickPickChip} onPress={() => handleAddEssential(qp)}>
              <Text style={styles.quickPickEmoji}>{qp.emoji}</Text>
              <Text style={styles.quickPickLabel} numberOfLines={1}>
                {qp.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {rowsByOwner.map(([ownerName, ownerRows]) => (
          <View key={ownerName} style={styles.ownerGroup}>
            <Text style={styles.ownerHeading}>{ownerName}의 필수품</Text>
            {ownerRows.map(({ item }) => (
              <View key={item.id} style={styles.itemCard}>
                <Pressable style={styles.checkbox} onPress={() => toggleChecked(item.id)}>
                  <Text style={styles.checkboxMark}>{item.checked ? '✅' : '⬜️'}</Text>
                </Pressable>

                <Pressable style={styles.photoThumb} onPress={() => attachPhoto(item.id)}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                  ) : (
                    <Text style={styles.photoPlaceholder}>{item.emoji}</Text>
                  )}
                </Pressable>

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
                  <Text style={styles.photoHint}>
                    {item.photoUrl ? '📸 출발 전 인증샷 첨부됨' : '탭해서 사진으로 인증해보세요'}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.confirmBtn,
                    item.confirmedBy.includes(CURRENT_USER_NAME) && styles.confirmBtnActive,
                  ]}
                  onPress={() => toggleConfirm(item.id)}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      item.confirmedBy.includes(CURRENT_USER_NAME) && styles.confirmBtnTextActive,
                    ]}
                  >
                    👍 확인 {item.confirmedBy.length}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}

        {rows.length === 0 && (
          <Text style={styles.emptyText}>
            위 퀵-픽에서 여권, 지갑처럼 놓치면 안 되는 물건을 추가해보세요.
          </Text>
        )}

        <Text style={styles.crewHint}>
          {trip.name} 크루 {members.length}명이 이 화면을 함께 보고 있어요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  banner: { borderRadius: 16, padding: 14 },
  bannerOk: { backgroundColor: '#E5F3E8' },
  bannerWarning: { backgroundColor: '#FFF1E6' },
  bannerText: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#8A8A8E' },
  quickPickRow: { gap: 10, paddingVertical: 4 },
  quickPickChip: {
    width: 76,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 4,
  },
  quickPickEmoji: { fontSize: 22 },
  quickPickLabel: { fontSize: 10, color: '#4A4A4E', textAlign: 'center', paddingHorizontal: 4 },
  ownerGroup: { gap: 8 },
  ownerHeading: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
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
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2A2A2E' },
  itemNameChecked: { color: '#B0B0B4', textDecorationLine: 'line-through' },
  photoHint: { fontSize: 10, color: '#8A8A8E' },
  confirmBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F1EC' },
  confirmBtnActive: { backgroundColor: '#FDE9DD' },
  confirmBtnText: { fontSize: 11, color: '#4A4A4E', fontWeight: '700' },
  confirmBtnTextActive: { color: '#C1560B' },
  emptyText: { textAlign: 'center', color: '#B0B0B4', fontSize: 13, marginTop: 8 },
  crewHint: { textAlign: 'center', color: '#B0B0B4', fontSize: 11, marginTop: 8 },
});
