import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { QUICK_PICK_CATALOG, QuickPickItem } from '../../data/quickPickCatalog';

interface Props {
  onPick: (item: QuickPickItem) => void;
}

/** 자주 쓰는 여행용품을 원터치로 현재 섹션에 추가하는 이모지 퀵-픽 바 */
export function QuickPickBar({ onPick }: Props) {
  return (
    <View>
      <Text style={styles.label}>⚡ 이모지 퀵-픽</Text>
      <FlatList
        horizontal
        data={QUICK_PICK_CATALOG}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.chip} onPress={() => onPick(item)}>
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text style={styles.chipLabel} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#8A8A8E', marginBottom: 8, marginLeft: 4 },
  list: { gap: 10, paddingBottom: 4 },
  chip: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    gap: 4,
  },
  chipEmoji: { fontSize: 24 },
  chipLabel: { fontSize: 10, color: '#4A4A4E', textAlign: 'center', paddingHorizontal: 4 },
});
