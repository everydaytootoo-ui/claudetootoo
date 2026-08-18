import React, { useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { DecorationCanvas } from '../components/decoration/DecorationCanvas';
import { BagSectionSheet, buildPackItemDraft } from '../components/packing/BagSectionSheet';
import { ShareCardGenerator } from '../components/share/ShareCardGenerator';
import { BagSection, DecorationAsset, StickerPlacement } from '../types/models';
import { useTripContext } from '../state/TripContext';
import { showInterstitialAfterCompletion, showRewardedAdForUnlock } from '../ads/AdMobManager';

const ASSET_CATALOG: DecorationAsset[] = [
  { id: 'flag-jp', type: 'sticker', emoji: '🇯🇵', label: '일본 국기', isPremium: false },
  { id: 'flag-fr', type: 'sticker', emoji: '🇫🇷', label: '프랑스 국기', isPremium: false },
  { id: 'heart', type: 'sticker', emoji: '💖', label: '하트', isPremium: false },
  { id: 'star', type: 'sticker', emoji: '⭐', label: '별', isPremium: false },
  { id: 'bear-keyring', type: 'keyring', emoji: '🧸', label: '곰돌이 키링', isPremium: true },
  { id: 'gold-badge', type: 'sticker', emoji: '🎖️', label: '골드 와펜', isPremium: true },
];

/** 잠긴 스티커는 아직 unlockedPremiumIds에 없으면 보상형 광고 시청을 유도한다. */
export function PackingScreen() {
  const { trip, bags, items, setItems, updateBagDecoration } = useTripContext();
  const bag = bags[0]; // MVP: 가족의 첫 번째 가방부터 시작 (가방 여러 개는 스와이프 탭으로 확장 가능)

  const [activeSection, setActiveSection] = useState<BagSection | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [unlockedPremiumIds, setUnlockedPremiumIds] = useState<string[]>([]);
  const sheetRef = useRef<BottomSheet>(null);

  const openSection = (section: BagSection) => {
    setActiveSection(section);
    sheetRef.current?.snapToIndex(0);
  };

  const bagItems = useMemo(
    () => items.filter((i) => bag.sections.some((s) => s.id === i.sectionId)),
    [items, bag.sections]
  );
  const sectionItems = useMemo(
    () => items.filter((i) => i.sectionId === activeSection?.id),
    [items, activeSection]
  );

  const visibleAssetCatalog = useMemo(
    () => ASSET_CATALOG.map((a) => (unlockedPremiumIds.includes(a.id) ? { ...a, isPremium: false } : a)),
    [unlockedPremiumIds]
  );

  const handleRequestUnlock = (asset: DecorationAsset) => {
    Alert.alert(
      '한정판 스티커 🔒',
      `광고를 끝까지 시청하면 "${asset.label}"을(를) 무료로 잠금 해제할 수 있어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '광고 보고 해금하기',
          onPress: () =>
            showRewardedAdForUnlock(
              'premium_sticker',
              () => setUnlockedPremiumIds((prev) => [...prev, asset.id]),
              () => Alert.alert('아쉬워요', '광고를 끝까지 시청해야 해금할 수 있어요.')
            ),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>🎒 캐꾸 & 짐싸기</Text>

        <DecorationCanvas
          bagKind={bag.kind}
          color={bag.decoration.color}
          placements={bag.decoration.placements}
          assetCatalog={visibleAssetCatalog}
          onRequestUnlock={handleRequestUnlock}
          onChangeColor={(color) => updateBagDecoration(bag.id, color, bag.decoration.placements)}
          onChangePlacements={(placements: StickerPlacement[]) =>
            updateBagDecoration(bag.id, bag.decoration.color, placements)
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

        <Pressable
          style={styles.shareCta}
          onPress={() => {
            setShareVisible(true);
            // 짐싸기 세션 완료 시점(공유 카드 진입)에 자연스럽게 전면 광고 노출
            showInterstitialAfterCompletion();
          }}
        >
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
              trip={trip}
              bag={bag}
              items={bagItems}
              assetCatalog={ASSET_CATALOG}
              onCardExported={() => showInterstitialAfterCompletion()}
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
