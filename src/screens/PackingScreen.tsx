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
import { BaggageMode, BagSection, DecorationAsset, SectionSlot, StickerPlacement } from '../types/models';
import { CURRENT_USER_NAME, useTripContext } from '../state/TripContext';
import { showInterstitialAfterCompletion, showRewardedAdForUnlock } from '../ads/AdMobManager';
import { AppNavigationProp } from '../navigation/RootNavigator';
import { QuickPickItem } from '../data/quickPickCatalog';

const SECTION_ICON_OPTIONS = ['🧦', '💻', '🧢', '🥾', '🧴', '🎮', '📚', '🪴'];

const SLOT_OPTIONS: Array<{ slot: SectionSlot | null; label: string; icon: string }> = [
  { slot: 'left', label: '왼쪽 큰 칸', icon: '◧' },
  { slot: 'right', label: '오른쪽 큰 칸', icon: '◨' },
  { slot: 'pocket-top', label: '위쪽 포켓', icon: '👝' },
  { slot: 'pocket-bottom', label: '아래쪽 포켓', icon: '🎀' },
  { slot: null, label: '안 정함', icon: '—' },
];

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
  const {
    trip,
    bags,
    items,
    setItems,
    updateBagDecoration,
    updateBagWeightLimit,
    addBag,
    deleteBag,
    addSection,
    updateSection,
    deleteSection,
  } = useTripContext();
  const navigation = useNavigation<AppNavigationProp>();

  const [selectedBagId, setSelectedBagId] = useState(bags[0].id);
  const bag = bags.find((b) => b.id === selectedBagId) ?? bags[0];

  // id로만 들고 있고 실제 BagSection은 매 렌더마다 bag.sections에서 찾는다 —
  // 그래야 이름을 수정한 직후에도 시트에 최신 이름이 바로 반영된다(스냅샷을 들고 있으면 낡은 값이 보임).
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const activeSection = bag.sections.find((s) => s.id === activeSectionId) ?? null;

  const [shareVisible, setShareVisible] = useState(false);
  const [unlockedPremiumIds, setUnlockedPremiumIds] = useState<string[]>([]);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState(SECTION_ICON_OPTIONS[0]);
  const [newSectionMode, setNewSectionMode] = useState<BaggageMode>('checked');
  const [newSectionSlot, setNewSectionSlot] = useState<SectionSlot | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  // 다른 가방으로 전환하면 이전 가방의 구역이 열려 있던 하단 시트를 닫는다.
  useEffect(() => {
    setActiveSectionId(null);
    sheetRef.current?.close();
  }, [selectedBagId]);

  const openSection = (section: BagSection) => {
    setActiveSectionId(section.id);
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

  const openAddSectionModal = (presetSlot: SectionSlot | null = null) => {
    setEditingSectionId(null);
    setNewSectionName('');
    setNewSectionIcon(SECTION_ICON_OPTIONS[0]);
    setNewSectionMode('checked');
    setNewSectionSlot(presetSlot);
    setSectionModalVisible(true);
  };

  const handleEditSection = (section: BagSection) => {
    setEditingSectionId(section.id);
    setNewSectionName(section.name);
    setNewSectionIcon(section.icon);
    setNewSectionMode(section.baggageMode);
    setNewSectionSlot(section.slot);
    setSectionModalVisible(true);
  };

  const handleSaveSection = () => {
    if (!newSectionName.trim()) return;
    if (editingSectionId) {
      updateSection(bag.id, editingSectionId, {
        name: newSectionName.trim(),
        icon: newSectionIcon,
        baggageMode: newSectionMode,
        slot: newSectionSlot,
      });
    } else {
      addSection(bag.id, newSectionName.trim(), newSectionIcon, newSectionMode, newSectionSlot);
    }
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
          setActiveSectionId(null);
          sheetRef.current?.close();
        },
      },
    ]);
  };

  const handleDeleteBag = (bagId: string) => {
    const target = bags.find((b) => b.id === bagId);
    if (!target) return;
    if (bags.length <= 1) {
      Alert.alert('삭제할 수 없어요', '가방은 최소 1개가 있어야 해요.');
      return;
    }
    Alert.alert('가방 삭제', `"${target.label}"을(를) 삭제할까요? 안에 담긴 물품도 함께 삭제돼요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteBag(bagId);
          if (selectedBagId === bagId) {
            const remaining = bags.find((b) => b.id !== bagId);
            if (remaining) setSelectedBagId(remaining.id);
          }
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
          onDeleteBag={handleDeleteBag}
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
          onAddSectionPress={openAddSectionModal}
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
        onEditSection={handleEditSection}
        onDeleteSection={handleDeleteSection}
      />

      <Modal visible={sectionModalVisible} transparent animationType="fade">
        <View style={styles.shareModalBackdrop}>
          <View style={styles.sectionModalCard}>
            <Text style={styles.sectionModalTitle}>{editingSectionId ? '구역 수정' : '새 구역 추가'}</Text>
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
            <Text style={styles.slotPickerLabel}>가방 그림 속 위치</Text>
            <View style={styles.slotRow}>
              {SLOT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.label}
                  style={[styles.slotChip, newSectionSlot === opt.slot && styles.slotChipSelected]}
                  onPress={() => setNewSectionSlot(opt.slot)}
                >
                  <Text style={styles.slotChipIcon}>{opt.icon}</Text>
                  <Text style={[styles.slotChipText, newSectionSlot === opt.slot && styles.slotChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sectionModalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setSectionModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveSection}>
                <Text style={styles.modalSaveText}>{editingSectionId ? '저장' : '추가'}</Text>
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
  slotPickerLabel: { fontSize: 12, fontWeight: '700', color: '#8A8A8E', marginTop: 2 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F1EC',
  },
  slotChipSelected: { backgroundColor: '#FDE9DD' },
  slotChipIcon: { fontSize: 14 },
  slotChipText: { fontSize: 11, color: '#4A4A4E', fontWeight: '600' },
  slotChipTextSelected: { color: '#C1560B' },
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
