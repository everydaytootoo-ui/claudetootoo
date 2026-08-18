import React, { useMemo } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTripContext } from '../state/TripContext';
import { AppNavigationProp, RootStackParamList, RootTabParamList } from '../navigation/RootNavigator';
import { shareTripInvite } from '../utils/inviteShare';
import { collectEssentialItems, countUncheckedEssentials } from '../utils/essentialChecklist';

function computeDDay(startDateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(startDateIso);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'D-DAY';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

type Shortcut =
  | { kind: 'tab'; target: keyof RootTabParamList; icon: string; label: string; desc: string }
  | { kind: 'stack'; target: Exclude<keyof RootStackParamList, 'MainTabs'>; icon: string; label: string; desc: string };

const SHORTCUTS: Shortcut[] = [
  { kind: 'tab', target: 'Packing', icon: '🎒', label: '캐꾸 & 짐싸기', desc: '가방 꾸미고 체크리스트 챙기기' },
  { kind: 'tab', target: 'Search', icon: '🔍', label: '우리 크루 통합 검색', desc: '"약" 검색하면 위치까지 딱' },
  { kind: 'tab', target: 'Calendar', icon: '🗓', label: '여행 캘린더', desc: 'D-Day와 일자별 일정' },
  { kind: 'tab', target: 'Vault', icon: '📄', label: '바우처 보관함', desc: '항공권 · 예약증 · 메모' },
  { kind: 'stack', target: 'Group', icon: '👨‍👩‍👧‍👦', label: '여행 크루 관리', desc: '가족·친구 초대 코드 공유' },
];

export function HomeScreen() {
  const { trip, bags, items, members } = useTripContext();
  const navigation = useNavigation<AppNavigationProp>();

  const essentialRows = useMemo(() => collectEssentialItems(bags, items), [bags, items]);
  const uncheckedEssentials = useMemo(() => countUncheckedEssentials(essentialRows), [essentialRows]);

  const handleShareInvite = () => {
    shareTripInvite(trip).catch(() => Alert.alert('공유 시트를 열지 못했어요'));
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Text style={styles.heroDday}>{computeDDay(trip.startDate)}</Text>
          <Text style={styles.heroTitle}>{trip.name}</Text>
          <Text style={styles.heroDates}>
            {trip.startDate} ~ {trip.endDate} · 크루 {members.length}명 (가족·친구)
          </Text>
          <Pressable style={styles.inviteRow} onPress={handleShareInvite}>
            <View>
              <Text style={styles.inviteLabel}>여행 크루 초대 코드</Text>
              <Text style={styles.inviteCode}>{trip.inviteCode}</Text>
            </View>
            <Text style={styles.inviteShareText}>📤 공유</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.essentialBanner, uncheckedEssentials > 0 ? styles.essentialBannerWarning : styles.essentialBannerOk]}
          onPress={() => navigation.navigate('DepartureCheckIn')}
        >
          <Text style={styles.essentialBannerTitle}>
            {uncheckedEssentials > 0 ? `⚠️ 필수품 ${uncheckedEssentials}개 아직 못 챙겼어요` : '✅ 필수품 모두 챙겼어요'}
          </Text>
          <Text style={styles.essentialBannerDesc}>
            여권·지갑처럼 놓치면 안 되는 물건, 출발 전 서로 확인하고 사진으로 인증해보세요.
          </Text>
        </Pressable>

        <Text style={styles.sectionLabel}>바로가기</Text>
        <View style={styles.shortcutGrid}>
          {SHORTCUTS.map((s) => (
            <Pressable
              key={s.target}
              style={styles.shortcutCard}
              onPress={() => (s.kind === 'tab' ? navigation.navigate(s.target) : navigation.navigate(s.target))}
            >
              <Text style={styles.shortcutIcon}>{s.icon}</Text>
              <Text style={styles.shortcutLabel}>{s.label}</Text>
              <Text style={styles.shortcutDesc}>{s.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  heroCard: { backgroundColor: '#2A2A2E', borderRadius: 24, padding: 20, gap: 6 },
  heroDday: { color: '#FF8A5B', fontSize: 24, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  heroDates: { color: '#C7C7CC', fontSize: 12 },
  inviteRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3A3A3E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inviteLabel: { color: '#C7C7CC', fontSize: 12 },
  inviteCode: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  inviteShareText: { color: '#FF8A5B', fontSize: 12, fontWeight: '700' },
  essentialBanner: { borderRadius: 18, padding: 16, gap: 4 },
  essentialBannerWarning: { backgroundColor: '#FFF1E6' },
  essentialBannerOk: { backgroundColor: '#E5F3E8' },
  essentialBannerTitle: { fontSize: 14, fontWeight: '800', color: '#2A2A2E' },
  essentialBannerDesc: { fontSize: 11, color: '#6B6B6F' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#8A8A8E' },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shortcutCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  shortcutIcon: { fontSize: 24 },
  shortcutLabel: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  shortcutDesc: { fontSize: 11, color: '#8A8A8E' },
});
