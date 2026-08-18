import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { DecorationCanvas } from '../components/decoration/DecorationCanvas';
import { BagSectionSheet, buildPackItemDraft } from '../components/packing/BagSectionSheet';
import { ShareCardGenerator } from '../components/share/ShareCardGenerator';
import { WeatherSuggestionBar } from '../components/packing/WeatherSuggestionBar';
import { BaggageWeightGauge } from '../components/packing/BaggageWeightGauge';
import { BagSwitcher } from '../components/packing/BagSwitcher';
import { BagInteriorView } from '../components/packing/BagInteriorView';
import { BaggageMode, BagSection, DecorationAsset, StickerPlacement } from '../types/models';
import { CURRENT_USER_NAME, useTripContext } from '../state/TripContext';
import { showInterstitialAfterCompletion, showRewardedAdForUnlock } from '../ads/AdMobManager';
import { AppNavigationProp } from '../navigation/RootNavigator';
import { QuickPickItem } from '../data/quickPickCatalog';

const SECTION_ICON_OPTIONS = ['🧦', '💻', '🧢', '🥾', '🧴', '🎮', '📚', '🪴'];

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
  const { trip, bags, items, setItems, updateBagDecoration, updateBagWeightLimit, addBag, addSection, deleteSection } =
    useTripContext();
  const navigation = useNavigation<AppNavigationProp>();

  const [selectedBagId, setSelectedBagId] = useState(bags[0].id);
  const bag = bags.find((b) => b.id === selectedBagId) ?? bags[0];

  const [activeSection, setActiveSection] = useState<BagSection | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [unlockedPremiumIds, setUnlockedPremiumIds] = useState<string[]>([]);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState(SECTION_ICON_OPTIONS[0]);
  const [newSectionMode, setNewSectionMode] = useState<BaggageMode>('checked');
  const sheetRef = useRef<BottomSheet>(null);

  // 다른 가방으로 전환하면 이전 가방의 구역이 열려 있던 하단 시트를 닫는다.
  useEffect(() => {
    setActiveSection(null);
    sheetRef.current?.close();
  }, [selectedBagId]);

  const openSection = (section: BagSection) => {
    setActiveSection(section);
    sheetRef.current?.snapToIndex(0);
  };

  const handleToggleChecked = (itemId: string) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
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

  const handleAddWeatherItem = (quickPick: QuickPickItem) => {
    const targetSection = bag.sections[0];
    const draft = buildPackItemDraft(targetSection, quickPick, CURRENT_USER_NAME);
    setItems((prev) => [...prev, { ...draft, id: `${quickPick.id}-${Date.now()}` }]);
  };

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

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    addSection(bag.id, newSectionName.trim(), newSectionIcon, newSectionMode);
    setNewSectionName('');
    setNewSectionIcon(SECTION_ICON_OPTIONS[0]);
    setNewSectionMode('checked');
    setSectionModalVisible(false);
  };

  const handleDeleteSection = (section: BagSection) => {
    Alert.alert('구역 삭제', `"${section.name}" 구역을 삭제할까요? 안에 담긴 물품도 함께 삭제돼요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteSection(bag.id, section.id);
          setActiveSection(null);
          sheetRef.current?.close();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headingRow}>
          <Text style={styles.headingRowText}>🎒 캐꾸 & 짐싸기</Text>
          <Pressable onPress={() => navigation.navigate('Templates')} hitSlop={8}>
            <Text style={styles.templateLink}>📋 템플릿</Text>
          </Pressable>
        </View>

        <BagSwitcher
          bags={bags}
          selectedBagId={bag.id}
          onSelect={setSelectedBagId}
          onAddBag={(ownerName, kind) => setSelectedBagId(addBag(ownerName, kind))}
        />

        <WeatherSuggestionBar
          trip={trip}
          addedNames={bagItems.map((i) => i.name)}
          onAddItem={handleAddWeatherItem}
        />

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

        <BaggageWeightGauge
          bag={bag}
          items={bagItems}
          onChangeLimit={(kg) => updateBagWeightLimit(bag.id, kg)}
        />

        <Text style={styles.heading}>{bag.label} 내부</Text>
        <BagInteriorView
          bag={bag}
          items={bagItems}
          onToggleChecked={handleToggleChecked}
          onOpenSection={openSection}
          onAddSectionPress={() => setSectionModalVisible(true)}
        />

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
        onToggleChecked={handleToggleChecked}
        onAddQuickPickItem={(section, quickPick) => {
          const draft = buildPackItemDraft(section, quickPick, CURRENT_USER_NAME);
          setItems((prev) => [...prev, { ...draft, id: `${quickPick.id}-${Date.now()}` }]);
        }}
        onAttachPhoto={(itemId, localUri) =>
          setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, photoUrl: localUri } : i)))
        }
        onRemoveItem={(itemId) => setItems((prev) => prev.filter((i) => i.id !== itemId))}
        onDeleteSection={handleDeleteSection}
      />

      <Modal visible={sectionModalVisible} transparent animationType="fade">
        <View style={styles.shareModalBackdrop}>
          <View style={styles.sectionModalCard}>
            <Text style={styles.sectionModalTitle}>새 구역 추가</Text>
            <TextInput
              style={styles.sectionModalInput}
              placeholder="구역 이름 (예: 노트북 슬롯)"
              value={newSectionName}
              onChangeText={setNewSectionName}
            />
            <View style={styles.sectionIconRow}>
              {SECTION_ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.sectionIconChip, newSectionIcon === icon && styles.sectionIconChipSelected]}
                  onPress={() => setNewSectionIcon(icon)}
                >
                  <Text style={styles.sectionIconChipText}>{icon}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sectionModeRow}>
              <Pressable
                style={[styles.sectionModeChip, newSectionMode === 'checked' && styles.sectionModeChipSelected]}
                onPress={() => setNewSectionMode('checked')}
              >
                <Text
                  style={[styles.sectionModeText, newSectionMode === 'checked' && styles.sectionModeTextSelected]}
                >
                  🧳 위탁 수하물
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sectionModeChip, newSectionMode === 'carryOn' && styles.sectionModeChipSelected]}
                onPress={() => setNewSectionMode('carryOn')}
              >
                <Text
                  style={[styles.sectionModeText, newSectionMode === 'carryOn' && styles.sectionModeTextSelected]}
                >
                  🎒 기내 반입
                </Text>
              </Pressable>
            </View>
            <View style={styles.sectionModalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setSectionModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleAddSection}>
                <Text style={styles.modalSaveText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
  },
  headingRowText: { fontSize: 16, fontWeight: '700', color: '#2A2A2E' },
  heading: { fontSize: 16, fontWeight: '700', color: '#2A2A2E', margin: 16 },
  templateLink: { fontSize: 12, fontWeight: '700', color: '#FF8A5B' },
  sectionModalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12 },
  sectionModalTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  sectionModalInput: {
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  sectionIconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionIconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconChipSelected: { backgroundColor: '#FDE9DD' },
  sectionIconChipText: { fontSize: 18 },
  sectionModeRow: { flexDirection: 'row', gap: 8 },
  sectionModeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F1EC', alignItems: 'center' },
  sectionModeChipSelected: { backgroundColor: '#FDE9DD' },
  sectionModeText: { fontSize: 12, fontWeight: '600', color: '#4A4A4E' },
  sectionModeTextSelected: { color: '#C1560B' },
  sectionModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 8 },
  modalCancelText: { color: '#8A8A8E', fontSize: 13 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 10 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
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
