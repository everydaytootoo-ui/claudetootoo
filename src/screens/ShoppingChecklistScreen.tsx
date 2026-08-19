import React, { useMemo } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTripContext } from '../state/TripContext';
import { ChecklistItem, DDayCategory } from '../types/models';

const D_DAY_LABEL: Record<DDayCategory, string> = {
  'D-30': 'D-30',
  'D-14': 'D-14',
  'D-7': 'D-7',
  'D-1': 'D-1',
};

function groupByCategory(items: ChecklistItem[]): Array<{ category: string; items: ChecklistItem[] }> {
  const order: string[] = [];
  const byCategory = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, []);
      order.push(item.category);
    }
    byCategory.get(item.category)!.push(item);
  }
  return order.map((category) => ({ category, items: byCategory.get(category)! }));
}

/**
 * 여행 준비물을 D-Day와 상관없이 카테고리별로 훑어보고 체크하는 쇼핑 체크리스트 화면.
 * 아직 안 산(isCompleted: false) 물건 중 제휴 정보(affiliateInfo)가 있는 것에만
 * [최저가 구매] 버튼이 붙어, 체크리스트를 보다가 바로 구매로 넘어갈 수 있다.
 */
export function ShoppingChecklistScreen() {
  const { checklistItems, setChecklistItems } = useTripContext();

  const groups = useMemo(() => groupByCategory(checklistItems), [checklistItems]);

  const toggleCompleted = (id: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)));
  };

  const openAffiliateLink = async (item: ChecklistItem) => {
    if (!item.affiliateInfo) return;
    const canOpen = await Linking.canOpenURL(item.affiliateInfo.affiliateUrl);
    if (!canOpen) {
      Alert.alert('링크를 열 수 없어요', '구매 링크 주소를 확인해주세요.');
      return;
    }
    Linking.openURL(item.affiliateInfo.affiliateUrl);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>🛍️ 여행 준비 쇼핑 체크리스트</Text>
        <Text style={styles.subheading}>D-Day에 맞춰 미리 챙기고, 없는 건 바로 최저가로 구매해보세요.</Text>

        {groups.map((group) => (
          <View key={group.category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{group.category}</Text>
            {group.items.map((item) => (
              <View key={item.id} style={styles.row}>
                <Pressable style={styles.checkboxArea} onPress={() => toggleCompleted(item.id)} hitSlop={8}>
                  <Text style={styles.checkboxMark}>{item.isCompleted ? '✅' : '⬜️'}</Text>
                  <View style={styles.rowText}>
                    <Text style={[styles.itemTitle, item.isCompleted && styles.itemTitleDone]}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      {item.dDayCategory && (
                        <View style={styles.dDayChip}>
                          <Text style={styles.dDayChipText}>{D_DAY_LABEL[item.dDayCategory]}까지</Text>
                        </View>
                      )}
                      {item.affiliateInfo && <Text style={styles.priceText}>{item.affiliateInfo.price}</Text>}
                    </View>
                  </View>
                </Pressable>

                {!item.isCompleted && item.affiliateInfo && (
                  <Pressable style={styles.buyBtn} onPress={() => openAffiliateLink(item)}>
                    <Text style={styles.buyBtnText}>최저가 구매</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '800', color: '#2A2A2E' },
  subheading: { fontSize: 12, color: '#8A8A8E', marginTop: -8 },
  categoryBlock: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 10 },
  categoryTitle: { fontSize: 13, fontWeight: '800', color: '#8A6D4A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxMark: { fontSize: 20 },
  rowText: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#2A2A2E' },
  itemTitleDone: { color: '#B0B0B4', textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dDayChip: { backgroundColor: '#FDE9DD', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  dDayChipText: { fontSize: 10, color: '#C1560B', fontWeight: '700' },
  priceText: { fontSize: 11, color: '#8A8A8E' },
  buyBtn: { backgroundColor: '#FF8A5B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  buyBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
