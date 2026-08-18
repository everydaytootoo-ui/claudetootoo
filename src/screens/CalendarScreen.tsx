import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTripContext } from '../state/TripContext';
import { CalendarEvent } from '../types/models';

const CATEGORY_ICON: Record<CalendarEvent['category'], string> = {
  flight: '✈️',
  hotel: '🏨',
  activity: '🎡',
  food: '🍜',
  transport: '🚕',
  etc: '📌',
};

function computeDDay(startDateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(startDateIso);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'D-DAY';
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

/** D-Day 카운트다운 + 일자별(Day 1, Day 2...) 세부 일정을 관리하는 캘린더 화면 */
export function CalendarScreen() {
  const { trip, events, setEvents } = useTripContext();
  const [selectedDate, setSelectedDate] = useState(trip.startDate);
  const [formVisible, setFormVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [draftCategory, setDraftCategory] = useState<CalendarEvent['category']>('activity');

  const dayIndex = useMemo(() => {
    const diff = Math.round(
      (new Date(selectedDate).getTime() - new Date(trip.startDate).getTime()) / 86400000
    );
    return diff + 1;
  }, [selectedDate, trip.startDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    let cursor = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      marks[iso] = { color: '#FDE9DD', textColor: '#C1560B' };
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const evt of events) {
      marks[evt.date] = { ...(marks[evt.date] ?? {}), marked: true, dotColor: '#FF8A5B' };
    }
    marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: '#FF8A5B' };
    return marks;
  }, [events, trip.startDate, trip.endDate, selectedDate]);

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [events, selectedDate]
  );

  const addEvent = () => {
    if (!draftTitle.trim()) return;
    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      tripId: trip.id,
      date: selectedDate,
      time: draftTime.trim() || undefined,
      title: draftTitle.trim(),
      category: draftCategory,
      createdBy: '나',
    };
    setEvents((prev) => [...prev, newEvent]);
    setDraftTitle('');
    setDraftTime('');
    setFormVisible(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>🗓 {trip.name}</Text>
        <Text style={styles.dday}>{computeDDay(trip.startDate)}</Text>
      </View>

      <Calendar
        current={trip.startDate}
        minDate={trip.startDate}
        maxDate={trip.endDate}
        markingType="period"
        markedDates={markedDates}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        theme={{
          todayTextColor: '#FF8A5B',
          arrowColor: '#FF8A5B',
          selectedDayBackgroundColor: '#FF8A5B',
        }}
        style={styles.calendar}
      />

      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayTitle}>Day {Math.max(1, dayIndex)} 일정</Text>
        <Pressable style={styles.addBtn} onPress={() => setFormVisible(true)}>
          <Text style={styles.addBtnText}>+ 일정 추가</Text>
        </Pressable>
      </View>

      <FlatList
        data={dayEvents}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <Text style={styles.eventIcon}>{CATEGORY_ICON[item.category]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.time && <Text style={styles.eventTime}>{item.time}</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>이 날의 일정이 아직 없어요.</Text>}
      />

      <Modal visible={formVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedDate} 일정 추가</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="일정 제목 (예: 유니버설스튜디오 입장)"
              value={draftTitle}
              onChangeText={setDraftTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="시간 (예: 14:30, 선택)"
              value={draftTime}
              onChangeText={setDraftTime}
            />
            <View style={styles.categoryRow}>
              {(Object.keys(CATEGORY_ICON) as CalendarEvent['category'][]).map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, draftCategory === cat && styles.categoryChipSelected]}
                  onPress={() => setDraftCategory(cat)}
                >
                  <Text>{CATEGORY_ICON[cat]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setFormVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={addEvent}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  heading: { fontSize: 16, fontWeight: '700', color: '#2A2A2E' },
  dday: { fontSize: 16, fontWeight: '800', color: '#FF8A5B' },
  calendar: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  dayTitle: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F1EC', borderRadius: 10 },
  addBtnText: { fontSize: 12, color: '#4A4A4E', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
  },
  eventIcon: { fontSize: 20 },
  eventTitle: { fontSize: 13, fontWeight: '600', color: '#2A2A2E' },
  eventTime: { fontSize: 11, color: '#8A8A8E', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#B0B0B4', marginTop: 24, fontSize: 13 },
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
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: { backgroundColor: '#FDE9DD', borderWidth: 1, borderColor: '#FF8A5B' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 8 },
  modalCancelText: { color: '#8A8A8E', fontSize: 13 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF8A5B', borderRadius: 10 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
