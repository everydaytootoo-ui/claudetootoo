import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BAG_COLOR_HEX, BagColor, BagKind, DecorationAsset, StickerPlacement } from '../../types/models';
import { DraggableSticker } from './DraggableSticker';
import { BagSilhouette } from './BagSilhouette';

const COLOR_OPTIONS: BagColor[] = [
  'pastel_pink',
  'butter_yellow',
  'cream_white',
  'sage_green',
  'sky_blue',
  'charcoal_black',
];

interface DecorationCanvasProps {
  bagKind: BagKind;
  color: BagColor;
  placements: StickerPlacement[];
  assetCatalog: DecorationAsset[];
  /** 잠긴(프리미엄) 스티커 탭 시 보상형 광고 유도 콜백 */
  onRequestUnlock: (asset: DecorationAsset) => void;
  onChangeColor: (color: BagColor) => void;
  onChangePlacements: (placements: StickerPlacement[]) => void;
}

/**
 * ① '캐리어 꾸미기(캐꾸) Canvas'
 * - 가방 색상을 고르고, 하단 트레이에서 스티커/키링을 탭하면 캔버스 중앙에 배치되며
 * - 배치된 스티커는 드래그(이동)/핀치(크기)/회전 제스처로 자유롭게 꾸밀 수 있다.
 */
export function DecorationCanvas({
  bagKind,
  color,
  placements,
  assetCatalog,
  onRequestUnlock,
  onChangeColor,
  onChangePlacements,
}: DecorationCanvasProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 420 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customComposerOpen, setCustomComposerOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const nextZIndex = useRef(placements.length + 1);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const addSticker = (asset: DecorationAsset) => {
    if (asset.isPremium) {
      onRequestUnlock(asset);
      return;
    }
    const newPlacement: StickerPlacement = {
      id: `${asset.id}-${Date.now()}`,
      assetId: asset.id,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      scale: 1,
      zIndex: nextZIndex.current++,
    };
    setSelectedId(newPlacement.id);
    onChangePlacements([...placements, newPlacement]);
  };

  const addCustomSticker = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const newPlacement: StickerPlacement = {
      id: `custom-${Date.now()}`,
      assetId: 'custom',
      customText: trimmed,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      scale: 1,
      zIndex: nextZIndex.current++,
    };
    setSelectedId(newPlacement.id);
    onChangePlacements([...placements, newPlacement]);
    setCustomText('');
    setCustomComposerOpen(false);
  };

  const commitPlacement: React.ComponentProps<typeof DraggableSticker>['onCommit'] = (id, next) => {
    onChangePlacements(placements.map((p) => (p.id === id ? { ...p, ...next } : p)));
  };

  const removePlacement = (id: string) => {
    onChangePlacements(placements.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.canvasWrap}>
        <Pressable style={styles.canvas} onLayout={onCanvasLayout} onPress={() => setSelectedId(null)}>
          <BagSilhouette kind={bagKind} colorHex={BAG_COLOR_HEX[color]} />
          {placements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((placement) => {
              const asset = assetCatalog.find((a) => a.id === placement.assetId) ?? null;
              if (!asset && !placement.customText) return null;
              return (
                <DraggableSticker
                  key={placement.id}
                  asset={asset}
                  customText={placement.customText}
                  placement={placement}
                  canvasSize={canvasSize}
                  isSelected={selectedId === placement.id}
                  onSelect={setSelectedId}
                  onCommit={commitPlacement}
                  onRemove={removePlacement}
                />
              );
            })}
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>가방 색상</Text>
      <View style={styles.colorRow}>
        {COLOR_OPTIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChangeColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: BAG_COLOR_HEX[c] },
              color === c && styles.colorSwatchSelected,
            ]}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>스티커 & 키링</Text>
      <View style={styles.assetTray}>
        {assetCatalog.map((asset) => (
          <Pressable key={asset.id} style={styles.assetChip} onPress={() => addSticker(asset)}>
            <Text style={styles.assetEmoji}>{asset.emoji ?? '🏷️'}</Text>
            {asset.isPremium && <Text style={styles.lockBadge}>🔒</Text>}
          </Pressable>
        ))}
        {!customComposerOpen && (
          <Pressable style={styles.customTrigger} onPress={() => setCustomComposerOpen(true)}>
            <Text style={styles.customTriggerText}>✏️{'\n'}직접 입력</Text>
          </Pressable>
        )}
      </View>

      {customComposerOpen && (
        <View style={styles.customComposer}>
          <TextInput
            style={styles.customInput}
            value={customText}
            onChangeText={setCustomText}
            placeholder="원하는 글자나 이모지를 입력하세요"
            placeholderTextColor="#B0B0B4"
            autoFocus
            onSubmitEditing={addCustomSticker}
          />
          <Pressable style={styles.customCancelBtn} onPress={() => { setCustomComposerOpen(false); setCustomText(''); }}>
            <Text style={styles.customCancelBtnText}>취소</Text>
          </Pressable>
          <Pressable style={[styles.customAddBtn, !customText.trim() && styles.customAddBtnDisabled]} onPress={addCustomSticker} disabled={!customText.trim()}>
            <Text style={styles.customAddBtnText}>추가</Text>
          </Pressable>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  canvasWrap: { padding: 16 },
  canvas: {
    width: '100%',
    aspectRatio: 320 / 420,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionLabel: {
    marginTop: 12,
    marginLeft: 16,
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8E',
  },
  colorRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchSelected: { borderColor: '#FF8A5B' },
  assetTray: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingBottom: 24 },
  assetChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetEmoji: { fontSize: 26 },
  lockBadge: { position: 'absolute', bottom: -2, right: -2, fontSize: 12 },
  customTrigger: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTriggerText: { fontSize: 10, fontWeight: '700', color: '#C1560B', textAlign: 'center' },
  customComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2A2A2E',
  },
  customCancelBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  customCancelBtnText: { fontSize: 12, color: '#8A8A8E', fontWeight: '600' },
  customAddBtn: { backgroundColor: '#FF8A5B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  customAddBtnDisabled: { opacity: 0.4 },
  customAddBtnText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
});
