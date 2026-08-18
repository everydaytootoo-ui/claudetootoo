import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bag, PackItem } from '../../types/models';
import { computeCheckedBaggageWeight, WeightLevel } from '../../utils/baggageWeight';

interface Props {
  bag: Bag;
  items: PackItem[];
  onChangeLimit: (kg: number) => void;
}

const PRESET_LIMITS_KG = [15, 20, 23, 32];

const LEVEL_COLOR: Record<WeightLevel, string> = {
  safe: '#3FB27F',
  caution: '#F2B705',
  over: '#E5484D',
};

const LEVEL_BADGE: Record<WeightLevel, string> = {
  safe: '🟢 안전',
  caution: '🟡 주의',
  over: '🔴 초과',
};

/**
 * ② 가방 하단에 붙는 위탁 수하물 예상 무게 게이지 — "[12.5kg / 15kg 🟢 안전]" 형태.
 * 게이지 바 자체는 항상 보이는 요약이고, 허용량(kg) 프리셋 선택기만 탭해야 펼쳐진다.
 */
export function BaggageWeightGauge({ bag, items, onChangeLimit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => computeCheckedBaggageWeight(bag, items), [bag, items]);
  const estimatedKg = (summary.estimatedGrams / 1000).toFixed(1);
  const fillPercent = Math.min(1, summary.ratio) * 100;

  return (
    <Pressable style={styles.card} onPress={() => setExpanded((e) => !e)}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>⚖️ 위탁 수하물 예상 무게</Text>
        <View style={styles.headerRight}>
          <Text style={styles.badge}>{LEVEL_BADGE[summary.level]}</Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillPercent}%`, backgroundColor: LEVEL_COLOR[summary.level] }]} />
      </View>
      <Text style={styles.weightText}>
        {estimatedKg}kg / {bag.weightLimitKg}kg
      </Text>

      {expanded && (
        <View style={styles.presetRow}>
          {PRESET_LIMITS_KG.map((kg) => (
            <Pressable
              key={kg}
              style={[styles.presetChip, bag.weightLimitKg === kg && styles.presetChipSelected]}
              onPress={() => onChangeLimit(kg)}
            >
              <Text style={[styles.presetText, bag.weightLimitKg === kg && styles.presetTextSelected]}>{kg}kg</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginHorizontal: 16, marginTop: 4, gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  badge: { fontSize: 12, fontWeight: '700' },
  chevron: { fontSize: 12, color: '#B0B0B4' },
  track: { height: 10, borderRadius: 5, backgroundColor: '#F0EDE6', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  weightText: { fontSize: 12, color: '#4A4A4E', fontWeight: '600' },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F3F1EC' },
  presetChipSelected: { backgroundColor: '#FDE9DD' },
  presetText: { fontSize: 11, color: '#4A4A4E', fontWeight: '600' },
  presetTextSelected: { color: '#C1560B' },
});
