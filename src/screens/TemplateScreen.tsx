import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTripContext } from '../state/TripContext';
import { PackTemplate } from '../types/models';
import { buildTemplateFromBag } from '../utils/templateBuilder';
import { deletePackTemplate, listPackTemplates, savePackTemplate } from '../lib/templateStorage';

/** ④ 지금 가방 구성을 템플릿으로 저장하고, 다음 여행에서 1초 만에 그대로 불러오는 화면 */
export function TemplateScreen() {
  const { bags, items, applyTemplateToBag } = useTripContext();
  const bag = bags[0];

  const [templates, setTemplates] = useState<PackTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    listPackTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('템플릿 이름을 입력해주세요.');
      return;
    }
    const template = buildTemplateFromBag(bag, items, templateName.trim());
    await savePackTemplate(template);
    setTemplateName('');
    setSaveModalVisible(false);
    refresh();
  };

  const handleApply = (template: PackTemplate) => {
    Alert.alert(
      '템플릿 불러오기',
      `"${template.name}" 템플릿을 지금 가방에 적용할까요? 현재 짐 구성은 덮어써져요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '적용하기',
          onPress: () => {
            applyTemplateToBag(bag.id, template);
            Alert.alert('적용 완료 🎉', '템플릿 구조로 가방을 다시 채웠어요.');
          },
        },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    await deletePackTemplate(id);
    refresh();
  };

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.desc}>
              지금 가방 구성을 템플릿으로 저장하면, 다음 여행 만들 때 1초 만에 그대로 불러올 수 있어요.
            </Text>
            <Pressable style={styles.saveBtn} onPress={() => setSaveModalVisible(true)}>
              <Text style={styles.saveBtnText}>📋 지금 가방을 템플릿으로 저장</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>저장된 템플릿이 아직 없어요.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>
                {item.sections.length}개 구역 · 물품 {item.items.length}개
              </Text>
            </View>
            <Pressable style={styles.applyBtn} onPress={() => handleApply(item)}>
              <Text style={styles.applyBtnText}>불러오기</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
              <Text style={styles.deleteText}>삭제</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>템플릿 이름</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예) 3박4일 일본여행 템플릿"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setSaveModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSave}>
                <Text style={styles.modalSaveText}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  listContent: { padding: 16, paddingBottom: 48, gap: 10 },
  headerSection: { gap: 12, marginBottom: 8 },
  desc: { fontSize: 12, color: '#6B6B6F' },
  saveBtn: { backgroundColor: '#FF8A5B', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#B0B0B4', marginTop: 24, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  cardDesc: { fontSize: 11, color: '#8A8A8E', marginTop: 2 },
  applyBtn: { backgroundColor: '#2A2A2E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  applyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  deleteText: { fontSize: 11, color: '#B0B0B4' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  modalInput: {
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 8 },
  modalCancelText: { color: '#8A8A8E', fontSize: 13 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 10 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
