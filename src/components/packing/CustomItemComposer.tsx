import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QuickPickItem } from '../../data/quickPickCatalog';
import { guessRestrictionCategory } from '../../data/restrictedItems';

/** 정해진 퀵-픽 목록에 없는 물건을 위한 이모지 후보 — 자주 챙기는 카테고리 위주로 골고루 구성 */
const EMOJI_CHOICES = [
  '👕', '👖', '🧦', '👟', '🧢', '🕶️', '🧣', '☂️',
  '📱', '🔌', '🔋', '🎧', '📷', '💻',
  '💊', '🪥', '🧴', '🧻',
  '📚', '📓', '✏️', '🔑', '💳', '🧸',
];

interface Props {
  onAdd: (item: QuickPickItem) => void;
}

/** 정해진 퀵-픽 카탈로그에 없는 물건도 이름 + 이모지를 직접 골라 추가할 수 있게 하는 인라인 폼 */
export function CustomItemComposer({ onAdd }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({
      id: `custom-${Date.now()}`,
      emoji,
      name: trimmed,
      restriction: guessRestrictionCategory(trimmed),
    });
    setName('');
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <Pressable style={styles.toggleChip} onPress={() => setExpanded(true)}>
        <Text style={styles.toggleChipText}>✏️ 내 물건 직접 추가</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.composer}>
      <View style={styles.inputRow}>
        <Text style={styles.previewEmoji}>{emoji}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="물건 이름 (예: 여행용 목베개)"
          placeholderTextColor="#B0B0B4"
          autoFocus
          onSubmitEditing={handleAdd}
        />
      </View>
      <View style={styles.emojiRow}>
        {EMOJI_CHOICES.map((choice) => (
          <Pressable
            key={choice}
            style={[styles.emojiChip, emoji === choice && styles.emojiChipSelected]}
            onPress={() => setEmoji(choice)}
          >
            <Text style={styles.emojiChipText}>{choice}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actionsRow}>
        <Pressable style={styles.cancelBtn} onPress={() => setExpanded(false)}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </Pressable>
        <Pressable style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]} onPress={handleAdd} disabled={!name.trim()}>
          <Text style={styles.addBtnText}>추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1E6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  toggleChipText: { fontSize: 12, fontWeight: '700', color: '#C1560B' },
  composer: { backgroundColor: '#F8F5EE', borderRadius: 16, padding: 12, gap: 10, marginTop: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewEmoji: { fontSize: 28 },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2A2A2E',
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipSelected: { backgroundColor: '#FF8A5B' },
  emojiChipText: { fontSize: 17 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, color: '#8A8A8E', fontWeight: '600' },
  addBtn: { backgroundColor: '#FF8A5B', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
});
