import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTripContext } from '../state/TripContext';
import { VaultDocument, VaultDocumentType } from '../types/models';

const TYPE_LABEL: Record<VaultDocumentType, string> = {
  flight_ticket: '✈️ 항공권',
  hotel_voucher: '🏨 호텔 예약증',
  qr_code: '📱 QR코드',
  memo: '📝 메모',
  other: '📎 기타',
};

/** 항공권 PDF/E-Ticket, 호텔 예약증·QR, 오프라인 메모를 한 곳에 보관하는 바우처 보관함 */
export function VaultScreen() {
  const { trip, documents, setDocuments } = useTripContext();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [memoModalVisible, setMemoModalVisible] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoText, setMemoText] = useState('');

  const addFileDocument = async (type: VaultDocumentType) => {
    setAddModalVisible(false);
    if (type === 'memo') {
      setMemoModalVisible(true);
      return;
    }

    if (type === 'qr_code') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      pushDocument({
        type,
        title: 'QR코드',
        fileUrl: result.assets[0].uri,
        fileMimeType: result.assets[0].mimeType,
      });
      return;
    }

    // 항공권/호텔 예약증: PDF 또는 이미지 모두 허용
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    pushDocument({
      type,
      title: asset.name ?? TYPE_LABEL[type],
      fileUrl: asset.uri,
      fileMimeType: asset.mimeType,
    });
  };

  const pushDocument = (
    partial: Pick<VaultDocument, 'type' | 'title' | 'fileUrl' | 'fileMimeType'> & { memoText?: string }
  ) => {
    const doc: VaultDocument = {
      id: `doc-${Date.now()}`,
      tripId: trip.id,
      createdBy: '나',
      createdAt: new Date().toISOString(),
      ...partial,
    };
    setDocuments((prev) => [doc, ...prev]);
  };

  const saveMemo = () => {
    if (!memoTitle.trim() || !memoText.trim()) {
      Alert.alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    pushDocument({
      type: 'memo',
      title: memoTitle.trim(),
      fileUrl: undefined,
      fileMimeType: undefined,
      memoText: memoText.trim(),
    });
    setMemoTitle('');
    setMemoText('');
    setMemoModalVisible(false);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>📄 바우처 & 메모 보관함</Text>
        <Pressable style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addBtnText}>+ 추가</Text>
        </Pressable>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>항공권, 호텔 예약증, QR코드나 메모를 저장해보세요.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>{TYPE_LABEL[item.type]}</Text>
              <Pressable onPress={() => removeDocument(item.id)} hitSlop={8}>
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.memoText && <Text style={styles.cardMemo}>{item.memoText}</Text>}
            {item.fileUrl && <Text style={styles.cardFile}>첨부파일 저장됨 · {item.fileMimeType ?? '파일'}</Text>}
          </View>
        )}
      />

      <Modal visible={addModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setAddModalVisible(false)}>
          <View style={styles.modalCard}>
            {(Object.keys(TYPE_LABEL) as VaultDocumentType[]).map((type) => (
              <Pressable key={type} style={styles.typeOption} onPress={() => addFileDocument(type)}>
                <Text style={styles.typeOptionText}>{TYPE_LABEL[type]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={memoModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>오프라인 메모</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="제목 (예: 숙소 체크인 안내)"
              value={memoTitle}
              onChangeText={setMemoTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="내용을 적어주세요"
              value={memoText}
              onChangeText={setMemoText}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setMemoModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveMemo}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  heading: { fontSize: 16, fontWeight: '700', color: '#2A2A2E' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 12 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { fontSize: 11, color: '#8A8A8E', fontWeight: '600' },
  removeText: { fontSize: 11, color: '#B0B0B4' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  cardMemo: { fontSize: 12, color: '#4A4A4E' },
  cardFile: { fontSize: 11, color: '#8A8A8E' },
  emptyText: { textAlign: 'center', color: '#B0B0B4', marginTop: 32, fontSize: 13 },
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
  modalTextarea: { minHeight: 80, textAlignVertical: 'top' },
  typeOption: { paddingVertical: 12 },
  typeOptionText: { fontSize: 14, color: '#2A2A2E', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 8 },
  modalCancelText: { color: '#8A8A8E', fontSize: 13 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 10 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
