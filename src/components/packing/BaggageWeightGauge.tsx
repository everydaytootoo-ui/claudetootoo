import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bag } from '../../types/models';
import { lookupAirlineBaggage } from '../../data/airlineBaggagePolicy';

interface Props {
  bag: Bag;
  onChangeLimits: (updates: Partial<Pick<Bag, 'weightLimitKg' | 'carryOnWeightLimitKg'>>) => void;
}

/**
 * ② 위탁/기내 수하물 허용량 설정 카드.
 * 물건 이름으로 무게를 추측해 보여주는 "예상 무게"는 부정확해서 표시하지 않고,
 * 편명으로 항공사 허용량을 자동으로 채우거나 직접 kg 숫자를 입력해 유저가 스스로 기준을 정한다.
 */
export function BaggageWeightGauge({ bag, onChangeLimits }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [lookupNote, setLookupNote] = useState<string | null>(null);

  const handleLookup = () => {
    const result = lookupAirlineBaggage(flightNumber);
    if (!result) {
      setLookupNote(null);
      Alert.alert('편명을 확인해주세요', '예: KE001, 7C123 처럼 항공사 코드 + 숫자로 입력해주세요.\n아직 등록되지 않은 항공사라면 아래에서 직접 입력해주세요.');
      return;
    }
    onChangeLimits({ weightLimitKg: result.checkedKg, carryOnWeightLimitKg: result.carryOnKg });
    setLookupNote(`${result.airlineName} 기준 위탁 ${result.checkedKg}kg · 기내 ${result.carryOnKg}kg 적용됨`);
  };

  return (
    <Pressable style={styles.card} onPress={() => setExpanded((e) => !e)}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>⚖️ 수하물 허용량</Text>
        <View style={styles.headerRight}>
          <Text style={styles.summaryText}>
            위탁 {bag.weightLimitKg}kg · 기내 {bag.carryOnWeightLimitKg}kg
          </Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedArea} onStartShouldSetResponder={() => true}>
          <Text style={styles.sectionLabel}>✈️ 편명으로 자동 조회</Text>
          <View style={styles.flightRow}>
            <TextInput
              style={styles.flightInput}
              placeholder="예: KE001"
              placeholderTextColor="#B0B0B4"
              value={flightNumber}
              onChangeText={setFlightNumber}
              autoCapitalize="characters"
              onSubmitEditing={handleLookup}
            />
            <Pressable style={styles.lookupBtn} onPress={handleLookup}>
              <Text style={styles.lookupBtnText}>조회</Text>
            </Pressable>
          </View>
          {lookupNote && <Text style={styles.lookupNote}>{lookupNote}</Text>}

          <Text style={styles.sectionLabel}>✏️ 직접 입력 (추가 구매한 수하물 등)</Text>
          <ManualLimitInput label="위탁 허용량" valueKg={bag.weightLimitKg} onSubmit={(kg) => onChangeLimits({ weightLimitKg: kg })} />
          <ManualLimitInput label="기내 허용량" valueKg={bag.carryOnWeightLimitKg} onSubmit={(kg) => onChangeLimits({ carryOnWeightLimitKg: kg })} />
        </View>
      )}
    </Pressable>
  );
}

function ManualLimitInput({ label, valueKg, onSubmit }: { label: string; valueKg: number; onSubmit: (kg: number) => void }) {
  const [draft, setDraft] = useState(String(valueKg));

  // 편명 조회 등으로 valueKg가 바깥에서 바뀌면(입력 중이 아닐 때) 입력창도 최신값으로 맞춘다
  useEffect(() => {
    setDraft(String(valueKg));
  }, [valueKg]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n > 0) {
      onSubmit(Math.round(n * 10) / 10);
    } else {
      setDraft(String(valueKg));
    }
  };

  return (
    <View style={styles.manualRow}>
      <Text style={styles.manualLabel}>{label}</Text>
      <TextInput
        style={styles.manualInput}
        value={draft}
        onChangeText={setDraft}
        onEndEditing={commit}
        onSubmitEditing={commit}
        keyboardType="numeric"
      />
      <Text style={styles.manualUnit}>kg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginHorizontal: 16, marginTop: 4, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  summaryText: { fontSize: 12, color: '#4A4A4E', fontWeight: '600' },
  chevron: { fontSize: 12, color: '#B0B0B4' },
  expandedArea: { gap: 8, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8A8A8E', marginTop: 4 },
  flightRow: { flexDirection: 'row', gap: 8 },
  flightInput: {
    flex: 1,
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#2A2A2E',
  },
  lookupBtn: { backgroundColor: '#FF8A5B', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  lookupBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  lookupNote: { fontSize: 11, color: '#3FB27F', fontWeight: '700' },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualLabel: { fontSize: 12, color: '#4A4A4E', fontWeight: '600', width: 74 },
  manualInput: {
    width: 64,
    backgroundColor: '#F3F1EC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#2A2A2E',
    textAlign: 'right',
  },
  manualUnit: { fontSize: 12, color: '#8A8A8E' },
});
