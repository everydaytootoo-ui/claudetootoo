import React, { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { DecorationCanvas } from '../components/decoration/DecorationCanvas';
import { BagSectionSheet, buildPackItemDraft } from '../components/packing/BagSectionSheet';
import { ShareCardGenerator } from '../components/share/ShareCardGenerator';
import { Bag, BagSection, DecorationAsset, PackItem, StickerPlacement, Trip } from '../types/models';

const ASSET_CATALOG: DecorationAsset[] = [
  { id: 'flag-jp', type: 'sticker', emoji: '🇯🇵', label: '일본 국기', isPremium: false },
  { id: 'flag-fr', type: 'sticker', emoji: '🇫🇷', label: '프랑스 국기', isPremium: false },
  { id: 'heart', type: 'sticker', emoji: '💖', label: '하트', isPremium: false },
  { id: 'star', type: 'sticker', emoji: '⭐', label: '별', isPremium: false },
  { id: 'bear-keyring', type: 'keyring', emoji: '🧸', label: '곰돌이 키링', isPremium: true },
  { id: 'gold-badge', type: 'sticker', emoji: '🎖️', label: '골드 와펜', isPremium: true },
];

const MOCK_TRIP: Trip = {
  id: 'trip-1',
  familyId: 'family-1',
  name: '가족 오사카 여행',
  destinationCountry: 'JP',
  season: 'winter',
  startDate: '2026-09-20',
  endDate: '2026-09-24',
  inviteCode: 'AB12CD',
};

function createInitialBag(): Bag {
  const bagId = 'bag-1';
  return {
    id: bagId,
    tripId: MOCK_TRIP.id,
    ownerName: '엄마',
    kind: 'carryon24',
    label: '엄마 24인치 캐리어',
    decoration: { bagId, color: 'pastel_pink', placements: [] },
    sections: [
      { id: 'sec-left', bagId, kind: 'main-left', name: '왼쪽 메인', icon: '👕', baggageMode: 'checked', isCustom: false },
      { id: 'sec-right', bagId, kind: 'main-right', name: '오른쪽 메인', icon: '👖', baggageMode: 'checked', isCustom: false },
      { id: 'sec-hidden', bagId, kind: 'hidden-pocket', name: '히든포켓', icon: '🤫', baggageMode: 'carryOn', isCustom: false },
    ],
  };
}

export function PackingScreen() {
  const [bag, setBag] = useState<Bag>(createInitialBag);
  const [items, setItems] = useState<PackItem[]>([]);
  const [activeSection, setActiveSection] = useState<BagSection | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const sheetRef = useRef<BottomSheet>(null);

  const openSection = (section: BagSection) => {
    setActiveSection(section);
    sheetRef.current?.snapToIndex(0);
  };

  const sectionItems = useMemo(
    () => items.filter((i) => i.sectionId === activeSection?.id),
    [items, activeSection]
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>🎒 캐꾸 & 짐싸기</Text>

        <DecorationCanvas
          bagKind={bag.kind}
          color={bag.decoration.color}
          placements={bag.decoration.placements}
          assetCatalog={ASSET_CATALOG}
          onRequestUnlock={(asset) => console.log('보상형 광고 시청 유도:', asset.label)}
          onChangeColor={(color) =>
            setBag((prev) => ({ ...prev, decoration: { ...prev.decoration, color } }))
          }
          onChangePlacements={(placements: StickerPlacement[]) =>
            setBag((prev) => ({ ...prev, decoration: { ...prev.decoration, placements } }))
          }
        />

        <Text style={styles.heading}>가방 구역</Text>
        <View style={styles.sectionRow}>
          {bag.sections.map((section) => (
            <Pressable key={section.id} style={styles.sectionCard} onPress={() => openSection(section)}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionName}>{section.name}</Text>
              <Text style={styles.sectionCount}>
                {items.filter((i) => i.sectionId === section.id && i.checked).length}/
                {items.filter((i) => i.sectionId === section.id).length}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.shareCta} onPress={() => setShareVisible(true)}>
          <Text style={styles.shareCtaText}>📸 캐꾸 자랑 카드 만들기</Text>
        </Pressable>
      </ScrollView>

      <BagSectionSheet
        ref={sheetRef}
        section={activeSection}
        items={sectionItems}
        onToggleChecked={(itemId) =>
          setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)))
        }
        onAddQuickPickItem={(section, quickPick) => {
          const draft = buildPackItemDraft(section, quickPick, '나');
          setItems((prev) => [...prev, { ...draft, id: `${quickPick.id}-${Date.now()}` }]);
        }}
        onAttachPhoto={(itemId, localUri) =>
          setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, photoUrl: localUri } : i)))
        }
        onRemoveItem={(itemId) => setItems((prev) => prev.filter((i) => i.id !== itemId))}
      />

      <Modal visible={shareVisible} animationType="slide" transparent>
        <View style={styles.shareModalBackdrop}>
          <View style={styles.shareModalCard}>
            <ShareCardGenerator
              trip={MOCK_TRIP}
              bag={bag}
              items={items}
              assetCatalog={ASSET_CATALOG}
              onCardExported={() => console.log('전면 광고 노출 트리거')}
            />
            <Pressable style={styles.closeBtn} onPress={() => setShareVisible(false)}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  scroll: { paddingBottom: 48 },
  heading: { fontSize: 16, fontWeight: '700', color: '#2A2A2E', margin: 16 },
  sectionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  sectionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  sectionIcon: { fontSize: 24 },
  sectionName: { fontSize: 12, fontWeight: '600', color: '#2A2A2E' },
  sectionCount: { fontSize: 11, color: '#B0B0B4' },
  shareCta: {
    margin: 16,
    backgroundColor: '#FF8A5B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareCtaText: { color: 'white', fontWeight: '700', fontSize: 14 },
  shareModalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  shareModalCard: { backgroundColor: '#FBF7F0', borderRadius: 24, padding: 20, gap: 16 },
  closeBtn: { alignItems: 'center', paddingVertical: 8 },
  closeBtnText: { color: '#8A8A8E', fontSize: 13 },
});
