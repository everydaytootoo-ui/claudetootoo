import React, { useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTripContext } from '../state/TripContext';
import { searchFamilyItemsLocal, formatLocationPath, validateBaggagePlacement } from '../utils/baggageRules';

/** "약", "돼지코" 검색 시 [엄마 24인치 캐리어 -> 히든포켓 (사진)] 형태로 위치를 보여주는 통합 검색 화면 */
export function SearchScreen() {
  const { bags, items } = useTripContext();
  const [keyword, setKeyword] = useState('');

  const results = useMemo(() => searchFamilyItemsLocal(bags, items, keyword), [bags, items, keyword]);

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.heading}>🔍 가족 짐 통합 검색</Text>
      <TextInput
        style={styles.input}
        placeholder="예) 약, 돼지코, 카메라..."
        placeholderTextColor="#B0B0B4"
        value={keyword}
        onChangeText={setKeyword}
        autoCorrect={false}
        returnKeyType="search"
      />

      <FlatList
        data={results}
        keyExtractor={(r) => r.item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          keyword.trim().length > 0 ? (
            <Text style={styles.emptyText}>"{keyword}"에 해당하는 물건을 찾지 못했어요.</Text>
          ) : (
            <Text style={styles.emptyText}>가족이 챙긴 물건을 검색해보세요.</Text>
          )
        }
        renderItem={({ item: result }) => {
          const validation = validateBaggagePlacement(result.item.restriction, result.baggageMode);
          return (
            <View style={styles.card}>
              <View style={styles.thumb}>
                {result.item.photoUrl ? (
                  <Image source={{ uri: result.item.photoUrl }} style={styles.thumbImage} />
                ) : (
                  <Text style={styles.thumbEmoji}>{result.item.emoji}</Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.itemName}>{result.item.name}</Text>
                <Text style={styles.locationPath}>
                  {result.ownerName} · {formatLocationPath(result)}
                  {result.item.photoUrl ? ' · 실물 사진 첨부됨' : ''}
                </Text>
                {validation.level !== 'none' && (
                  <Text
                    style={[
                      styles.warning,
                      validation.level === 'danger' ? styles.warningDanger : styles.warningCaution,
                    ]}
                  >
                    {validation.message}
                  </Text>
                )}
              </View>
              <Text style={styles.checkMark}>{result.item.checked ? '✅' : '⬜️'}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  heading: { fontSize: 16, fontWeight: '700', color: '#2A2A2E', margin: 16, marginBottom: 8 },
  input: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  locationPath: { fontSize: 12, color: '#8A8A8E' },
  warning: { fontSize: 11, marginTop: 2 },
  warningDanger: { color: '#C0392B' },
  warningCaution: { color: '#C1560B' },
  checkMark: { fontSize: 18 },
  emptyText: { textAlign: 'center', color: '#B0B0B4', marginTop: 32, fontSize: 13 },
});
