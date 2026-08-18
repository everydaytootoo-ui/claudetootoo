import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Trip } from '../../types/models';
import { fetchTripWeather, WeatherSummary } from '../../lib/weather';
import { getWeatherRecommendations } from '../../data/weatherRecommendations';
import { QuickPickItem } from '../../data/quickPickCatalog';

interface Props {
  trip: Trip;
  addedNames: string[]; // 이미 가방에 담긴 물품 이름 — 추천 칩에 체크 표시용
  onAddItem: (quickPick: QuickPickItem) => void;
}

/** 여행지·날짜 기반 날씨 요약 + 원터치 추천 아이템을 보여주는 짧은 카드 (① 캐꾸 화면 상단용) */
export function WeatherSuggestionBar({ trip, addedNames, onAddItem }: Props) {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTripWeather(trip).then((summary) => {
      if (alive) setWeather(summary);
    });
    return () => {
      alive = false;
    };
  }, [trip.id, trip.startDate, trip.endDate]);

  const recommendations = useMemo(() => (weather ? getWeatherRecommendations(weather) : []), [weather]);

  if (!weather) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>🌦️ 날씨 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🌦️ {trip.destinationCity ?? trip.destinationCountry} 날씨</Text>
        <Text style={styles.temps}>
          {weather.minTempC}° ~ {weather.maxTempC}° · 강수 {weather.rainChancePercent}%
        </Text>
      </View>
      <Text style={styles.condition}>{weather.condition}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {recommendations.map((rec) => {
          const added = addedNames.includes(rec.name);
          return (
            <Pressable
              key={rec.id}
              style={[styles.chip, added && styles.chipAdded]}
              onPress={() => !added && onAddItem(rec)}
              disabled={added}
            >
              <Text style={styles.chipEmoji}>{rec.emoji}</Text>
              <Text style={styles.chipLabel} numberOfLines={1}>
                {rec.name}
              </Text>
              {added && <Text style={styles.chipCheck}>✓ 담음</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginHorizontal: 16, marginBottom: 4, gap: 6 },
  loadingText: { fontSize: 12, color: '#8A8A8E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  temps: { fontSize: 12, color: '#4A4A4E' },
  condition: { fontSize: 11, color: '#8A8A8E' },
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
