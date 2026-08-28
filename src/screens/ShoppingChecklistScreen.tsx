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

/** 여행 준비 순서상 얼마나 이른 시점에 해야 하는 일인지 — 클수록(D-30에 가까울수록) 먼저 처리해야 한다 */
const D_DAY_URGENCY: Record<DDayCategory, number> = { 'D-30': 30, 'D-14': 14, 'D-7': 7, 'D-1': 1 };

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
  const groups = order.map((category) => ({ category, items: byCategory.get(category)! }));

  // 카테고리는 그 안에서 가장 이른 D-Day 기준으로 정렬한다 — 제휴 상품이 있는 카테고리가
  // 급하지 않은데도 앞에 몰려 보이는 걸 막고, 실제로 먼저 처리해야 할 일이 자연스럽게 위로 온다.
  const categoryUrgency = (g: { items: ChecklistItem[] }) =>
    Math.max(0, ...g.items.map((i) => (i.dDayCategory ? D_DAY_URGENCY[i.dDayCategory] : 0)));
  return groups.sort((a, b) => categoryUrgency(b) - categoryUrgency(a));
}

/**
 * 여행 준비물을 D-Day 임박 순 카테고리로 훑어보고 체크하는 쇼핑 체크리스트 화면.
 * 아직 안 사고(isCompleted: false) 이미 갖고 있지도 않은(ownedAlready: false) 물건 중
 * 제휴 정보(affiliateInfo)가 있는 것에만 [인기제품 확인하기] 버튼이 붙는다.
 */
export function ShoppingChecklistScreen() {
  const { checklistItems, setChecklistItems } = useTripContext();

  const groups = useMemo(() => groupByCategory(checklistItems), [checklistItems]);

  const toggleCompleted = (id: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)));
  };

  const toggleOwned = (id: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, ownedAlready: !item.ownedAlready } : item)));
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
        <Text style={styles.subheading}>D-Day에 맞춰 미리 챙기고, 없는 건 인기제품을 바로 확인해보세요.</Text>
        <Text style={styles.disclosure}>
          "인기제품 확인하기"는 제휴 링크예요. 이 링크로 구매하시면 팩위드가 일정 수수료를 받을 수 있어요.
        </Text>

        {groups.map((group) => (
          <View key={group.category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{group.category}</Text>
            {group.items.map((item) => {
              const showBuy = !item.isCompleted && !item.ownedAlready && item.affiliateInfo;
              return (
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
                        {item.affiliateInfo && !item.isCompleted && (
                          <Text style={styles.priceText}>
                            {item.ownedAlready ? '이미 있음' : item.affiliateInfo.price}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>

                  {item.affiliateInfo && !item.isCompleted && (
                    <View style={styles.actionColumn}>
                      {showBuy && (
                        <Pressable style={styles.buyBtn} onPress={() => openAffiliateLink(item)}>
                          <Text style={styles.buyBtnText}>인기제품 확인하기</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => toggleOwned(item.id)} hitSlop={6}>
                        <Text style={styles.ownedLinkText}>{item.ownedAlready ? '다시 표시하기' : '이미 있어요'}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
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
  disclosure: { fontSize: 10, color: '#B0B0B4', marginTop: -8 },
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
  actionColumn: { alignItems: 'flex-end', gap: 4 },
  buyBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF8A5B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buyBtnText: { fontSize: 12, fontWeight: '700', color: '#FF8A5B' },
  ownedLinkText: { fontSize: 10, color: '#B0B0B4', fontWeight: '600', textDecorationLine: 'underline' },
});
