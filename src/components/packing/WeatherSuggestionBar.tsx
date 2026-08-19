import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Trip } from '../../types/models';
import { fetchTripWeather, WeatherSummary } from '../../lib/weather';
import { getTripRecommendations } from '../../data/weatherRecommendations';
import { QuickPickItem } from '../../data/quickPickCatalog';
import { getPowerAdvice } from '../../data/powerRecommendations';

interface Props {
  trip: Trip;
  addedNames: string[]; // 이미 가방에 담긴 물품 이름 — 추천 칩에 체크 표시용
  onAddItem: (quickPick: QuickPickItem) => void;
  /** 이미 담은 추천 칩을 다시 탭하면 호출된다 — 이름으로 매칭되는 물품을 다시 빼는 용도 */
  onRemoveItem: (quickPick: QuickPickItem) => void;
}

/**
 * 여행지·날짜 기반 날씨 요약 + 원터치 추천 아이템 카드 (① 캐꾸 화면 상단용).
 * 기본은 접힌 상태 — 헤더 한 줄(날씨 요약)만 보이고, 탭하면 추천 칩까지 펼쳐진다.
 */
export function WeatherSuggestionBar({ trip, addedNames, onAddItem, onRemoveItem }: Props) {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchTripWeather(trip).then((summary) => {
      if (alive) setWeather(summary);
    });
    return () => {
      alive = false;
    };
  }, [trip.id, trip.startDate, trip.endDate]);

  const recommendations = useMemo(() => (weather ? getTripRecommendations(weather, trip) : []), [weather, trip]);
  const powerAdvice = useMemo(() => getPowerAdvice(trip.destinationCountry), [trip.destinationCountry]);

  if (!weather) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>🌦️ 날씨 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.headerRow} onPress={() => setExpanded((e) => !e)}>
        <Text style={styles.title}>🌦️ {trip.destinationCity ?? trip.destinationCountry} 날씨</Text>
        <View style={styles.headerRight}>
          <Text style={styles.temps}>
            {weather.minTempC}° ~ {weather.maxTempC}° · 강수 {weather.rainChancePercent}%
          </Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <>
          <Text style={styles.condition}>{weather.condition}</Text>
          {powerAdvice && <Text style={styles.powerNote}>🔌 {powerAdvice.note}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {recommendations.map((rec) => {
              const added = addedNames.includes(rec.name);
              return (
                <Pressable
                  key={rec.id}
                  style={[styles.chip, added && styles.chipAdded]}
                  onPress={() => (added ? onRemoveItem(rec) : onAddItem(rec))}
                >
                  <Text style={styles.chipEmoji}>{rec.emoji}</Text>
                  <Text style={styles.chipLabel} numberOfLines={1}>
                    {rec.name}
                  </Text>
                  {added && <Text style={styles.chipCheck}>✓ 담음 · 탭하면 취소</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginHorizontal: 16, marginBottom: 4, gap: 6 },
  loadingText: { fontSize: 12, color: '#8A8A8E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  temps: { fontSize: 12, color: '#4A4A4E' },
  chevron: { fontSize: 12, color: '#B0B0B4' },
  condition: { fontSize: 11, color: '#8A8A8E' },
  powerNote: { fontSize: 11, color: '#4A4A4E', backgroundColor: '#F3F1EC', borderRadius: 10, padding: 8, lineHeight: 16 },
  chipRow: { gap: 8, paddingTop: 4 },
  chip: {
    minWidth: 68,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    gap: 2,
  },
  chipAdded: { backgroundColor: '#E5F3E8' },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 10, color: '#4A4A4E', textAlign: 'center' },
  chipCheck: { fontSize: 9, color: '#2F8F4E', fontWeight: '700' },
});
