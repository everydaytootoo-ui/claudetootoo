import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { BAG_COLOR_HEX, Bag, DecorationAsset, PackItem, Trip } from '../../types/models';
import { BagSilhouette } from '../decoration/BagSilhouette';

interface Props {
  trip: Trip;
  bag: Bag;
  items: PackItem[]; // 이 가방에 속한 전체 섹션의 물품 (엑스레이 투시용)
  assetCatalog: DecorationAsset[];
  /** 전면 광고 노출 지점 — 카드 저장/공유가 완료된 직후 상위에서 AdMob interstitial을 트리거 */
  onCardExported: () => void;
}

function computeDDay(startDateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(startDateIso);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'D-DAY';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

const COUNTRY_FLAG: Record<string, string> = {
  JP: '🇯🇵',
  KR: '🇰🇷',
  US: '🇺🇸',
  FR: '🇫🇷',
  TH: '🇹🇭',
  VN: '🇻🇳',
};

/**
 * ④ SNS 공유 카드 — 9:16(인스타 스토리 비율) 포토카드로
 * "가방 외관" + "가방 내부 엑스레이 투시" + "D-Day" + "여행지 스티커"를 한 화면에 합성한다.
 * ViewShot으로 오프스크린 프리뷰를 캡처해 갤러리 저장 또는 공유 시트로 전달한다.
 */
export function ShareCardGenerator({ trip, bag, items, assetCatalog, onCardExported }: Props) {
  const shotRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState(false);

  const checkedItems = items.filter((i) => i.checked);
  const flag = COUNTRY_FLAG[trip.destinationCountry] ?? '🌍';

  const capture = async () => {
    if (!shotRef.current) return null;
    const uri = await captureRef(shotRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    return uri;
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('사진 저장 권한이 필요해요', '설정에서 사진 접근 권한을 허용해주세요.');
        return;
      }
      const uri = await capture();
      if (!uri) return;
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('저장 완료 🎉', '캐꾸 카드가 갤러리에 저장됐어요!');
      onCardExported();
    } catch (e) {
      Alert.alert('저장에 실패했어요', String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      setBusy(true);
      const uri = await capture();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('공유를 지원하지 않는 기기예요');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      onCardExported();
    } catch (e) {
      Alert.alert('공유에 실패했어요', String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.dday}>{computeDDay(trip.startDate)}</Text>
            <Text style={styles.destinationSticker}>
              {flag} {trip.name}
            </Text>
          </View>

          {/* 가방 외관 (스티커 배치 포함, 읽기 전용 렌더) */}
          <View style={styles.bagExterior}>
            <BagSilhouette kind={bag.kind} colorHex={BAG_COLOR_HEX[bag.decoration.color]} />
            {bag.decoration.placements.map((p) => {
              const asset = assetCatalog.find((a) => a.id === p.assetId);
              const displayText = p.customText ?? asset?.emoji;
              if (!displayText) return null;
              return (
                <Text
                  key={p.id}
                  style={[
                    styles.exteriorSticker,
                    {
                      left: `${p.x * 100}%`,
                      top: `${p.y * 100}%`,
                      transform: [{ rotate: `${p.rotation}deg` }, { scale: p.scale }],
                    },
                  ]}
                >
                  {displayText}
                </Text>
              );
            })}
          </View>

          {/* 챙긴 짐 목록 — 겉모습뿐 아니라 실제로 뭘 쌌는지도 카드에서 바로 보여준다 */}
          <View style={styles.packedPanel}>
            <Text style={styles.packedTitle}>🎒 챙긴 짐 {checkedItems.length}개</Text>
            {checkedItems.length === 0 ? (
              <Text style={styles.packedEmpty}>아직 체크한 짐이 없어요</Text>
            ) : (
              <View style={styles.packedGrid}>
                {checkedItems.slice(0, 15).map((item) => (
                  <View key={item.id} style={styles.packedItem}>
                    <Text style={styles.packedEmoji}>{item.emoji}</Text>
                    <Text style={styles.packedName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                ))}
                {checkedItems.length > 15 && (
                  <View style={styles.packedItem}>
                    <Text style={styles.packedMoreText}>+{checkedItems.length - 15}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>{bag.label}</Text>
            <Text style={styles.footerCount}>
              챙긴 짐 {checkedItems.length} / {items.length}
            </Text>
          </View>
          <Text style={styles.brand}>PackWith 🧳</Text>
        </View>
      </ViewShot>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={busy}>
          <Text style={styles.actionBtnText}>{busy ? '처리 중...' : '📥 갤러리 저장'}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare} disabled={busy}>
          <Text style={[styles.actionBtnText, styles.shareBtnText]}>📤 스토리 공유</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_WIDTH = 270;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9; // 9:16 비율

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#2A2A2E',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dday: { color: '#FF8A5B', fontSize: 20, fontWeight: '800' },
  destinationSticker: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  bagExterior: {
    height: CARD_HEIGHT * 0.34,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FBF7F0',
  },
  exteriorSticker: { position: 'absolute', fontSize: 28 },
  packedPanel: {
    flex: 1,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#F8F5EE',
    padding: 12,
    gap: 8,
  },
  packedTitle: { color: '#2A2A2E', fontSize: 13, fontWeight: '800' },
  packedEmpty: { color: '#8A8A8E', fontSize: 11, textAlign: 'center', marginTop: 12 },
  packedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  packedItem: { width: 46, alignItems: 'center', gap: 2 },
  packedEmoji: { fontSize: 22 },
  packedName: { fontSize: 8, color: '#4A4A4E', textAlign: 'center' },
  packedMoreText: { fontSize: 13, fontWeight: '800', color: '#8A6D4A' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { color: '#FFFFFF', fontSize: 12 },
  footerCount: { color: '#C7C7CC', fontSize: 12 },
  brand: { color: '#8A8A8E', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  saveBtn: { backgroundColor: '#F3F1EC' },
  shareBtn: { backgroundColor: '#FF8A5B' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  shareBtnText: { color: '#FFFFFF' },
});
