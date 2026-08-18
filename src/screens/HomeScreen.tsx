import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTripContext } from '../state/TripContext';
import { RootTabParamList } from '../navigation/RootNavigator';

function computeDDay(startDateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(startDateIso);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'D-DAY';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

const SHORTCUTS: Array<{ tab: keyof RootTabParamList; icon: string; label: string; desc: string }> = [
  { tab: 'Packing', icon: '🎒', label: '캐꾸 & 짐싸기', desc: '가방 꾸미고 체크리스트 챙기기' },
  { tab: 'Search', icon: '🔍', label: '가족 통합 검색', desc: '"약" 검색하면 위치까지 딱' },
  { tab: 'Calendar', icon: '🗓', label: '여행 캘린더', desc: 'D-Day와 일자별 일정' },
  { tab: 'Vault', icon: '📄', label: '바우처 보관함', desc: '항공권 · 예약증 · 메모' },
];

export function HomeScreen() {
  const { trip } = useTripContext();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Text style={styles.heroDday}>{computeDDay(trip.startDate)}</Text>
          <Text style={styles.heroTitle}>{trip.name}</Text>
          <Text style={styles.heroDates}>
            {trip.startDate} ~ {trip.endDate}
          </Text>
          <View style={styles.inviteRow}>
            <Text style={styles.inviteLabel}>가족 초대 코드</Text>
            <Text style={styles.inviteCode}>{trip.inviteCode}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>바로가기</Text>
        <View style={styles.shortcutGrid}>
          {SHORTCUTS.map((s) => (
            <Pressable
              key={s.tab}
              style={styles.shortcutCard}
              onPress={() => navigation.navigate(s.tab)}
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
    backgroundColor: '#3A3A3E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inviteLabel: { color: '#C7C7CC', fontSize: 12 },
  inviteCode: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
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
