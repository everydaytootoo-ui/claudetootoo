import React, { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTripContext } from '../state/TripContext';
import { DESTINATIONS, DestinationOption, CityOption } from '../data/destinations';
import { getPowerAdvice } from '../data/powerRecommendations';
import { deriveSeason } from '../utils/season';
import { RootStackParamList } from '../navigation/RootNavigator';

const SEASON_LABEL: Record<string, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 여행지 국가·도시·일정을 직접 설정하는 화면. 저장하면 날씨/전원(콘센트·전압) 추천이 바로 갱신된다. */
export function TripSettingsScreen() {
  const { trip, updateTrip } = useTripContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const initialDest = DESTINATIONS.find((d) => d.code === trip.destinationCountry) ?? null;
  const [country, setCountry] = useState<DestinationOption | null>(initialDest);
  const [city, setCity] = useState<CityOption | null>(
    initialDest?.cities.find((c) => c.name === trip.destinationCity) ?? initialDest?.cities[0] ?? null
  );
  const [name, setName] = useState(trip.name);
  const [rangeStart, setRangeStart] = useState<string | null>(trip.startDate);
  const [rangeEnd, setRangeEnd] = useState<string | null>(trip.endDate);

  const powerAdvice = useMemo(() => (country ? getPowerAdvice(country.code) : null), [country]);

  const handleSelectCountry = (dest: DestinationOption) => {
    setCountry(dest);
    setCity(dest.cities[0] ?? null);
  };

  const handleDayPress = (day: DateData) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day.dateString);
      setRangeEnd(null);
      return;
    }
    if (day.dateString < rangeStart) {
      setRangeStart(day.dateString);
      setRangeEnd(null);
      return;
    }
    setRangeEnd(day.dateString);
  };

  const markedDates = useMemo(() => {
    if (!rangeStart) return {};
    if (!rangeEnd) {
      return { [rangeStart]: { startingDay: true, endingDay: true, color: '#FF8A5B', textColor: '#FFFFFF' } };
    }
    const marks: Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor: string }> = {};
    let cursor = rangeStart;
    while (cursor <= rangeEnd) {
      marks[cursor] = {
        startingDay: cursor === rangeStart,
        endingDay: cursor === rangeEnd,
        color: '#FF8A5B',
        textColor: '#FFFFFF',
      };
      cursor = addDays(cursor, 1);
    }
    return marks;
  }, [rangeStart, rangeEnd]);

  const handleSave = () => {
    if (!country || !city) {
      Alert.alert('여행지 국가와 도시를 먼저 선택해주세요.');
      return;
    }
    if (!rangeStart || !rangeEnd) {
      Alert.alert('캘린더에서 출발일과 도착일을 모두 선택해주세요.');
      return;
    }
    updateTrip({
      name: name.trim() || `${city.name} 여행`,
      destinationCountry: country.code,
      destinationCity: city.name,
      lat: city.lat,
      lon: city.lon,
      season: deriveSeason(rangeStart, country.code),
      startDate: rangeStart,
      endDate: rangeEnd,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>여행 이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="예: 가족 오사카 여행"
          placeholderTextColor="#B0B0B4"
        />

        <Text style={styles.label}>여행지 국가</Text>
        <View style={styles.chipWrap}>
          {DESTINATIONS.map((dest) => (
            <Pressable
              key={dest.code}
              style={[styles.chip, country?.code === dest.code && styles.chipSelected]}
              onPress={() => handleSelectCountry(dest)}
            >
              <Text style={[styles.chipText, country?.code === dest.code && styles.chipTextSelected]}>
                {dest.flag} {dest.nameKo}
              </Text>
            </Pressable>
          ))}
        </View>

        {country && (
          <>
            <Text style={styles.label}>도시</Text>
            <View style={styles.chipWrap}>
              {country.cities.map((c) => (
                <Pressable
                  key={c.name}
                  style={[styles.chip, city?.name === c.name && styles.chipSelected]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.chipText, city?.name === c.name && styles.chipTextSelected]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {powerAdvice && (
          <View style={styles.powerCard}>
            <Text style={styles.powerTitle}>🔌 콘센트 · 전압 정보</Text>
            <Text style={styles.powerNote}>{powerAdvice.note}</Text>
          </View>
        )}

        <Text style={styles.label}>여행 일정 (출발일 탭 → 도착일 탭)</Text>
        <View style={styles.calendarCard}>
          <Calendar markingType="period" markedDates={markedDates} onDayPress={handleDayPress} minDate={new Date().toISOString().slice(0, 10)} />
        </View>
        {rangeStart && rangeEnd && (
          <Text style={styles.rangeSummary}>
            {rangeStart} ~ {rangeEnd} · {country ? SEASON_LABEL[deriveSeason(rangeStart, country.code)] : ''}
          </Text>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하고 추천 받기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '800', color: '#2A2A2E', marginTop: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2E',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: '#FF8A5B' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#4A4A4E' },
  chipTextSelected: { color: '#FFFFFF' },
  powerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 4 },
  powerTitle: { fontSize: 13, fontWeight: '800', color: '#2A2A2E' },
  powerNote: { fontSize: 12, color: '#4A4A4E', lineHeight: 18 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  rangeSummary: { fontSize: 12, color: '#8A6D4A', fontWeight: '700', textAlign: 'center' },
  saveButton: { backgroundColor: '#FF8A5B', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
