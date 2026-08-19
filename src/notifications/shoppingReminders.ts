import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ChecklistItem, DDayCategory } from '../types/models';

const D_DAY_OFFSETS: Record<DDayCategory, number> = {
  'D-30': -30,
  'D-14': -14,
  'D-7': -7,
  'D-1': -1,
};

const D_DAY_ORDER: DDayCategory[] = ['D-30', 'D-14', 'D-7', 'D-1'];

function reminderId(dDay: DDayCategory): string {
  return `packwith-shopping-${dDay}`;
}

function atLocalTime(startDateIso: string, dayOffset: number, hour: number, minute: number): Date {
  const date = new Date(`${startDateIso}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** 미리 준비해야 할(dDayCategory가 있고 아직 안 산) 항목을 D-Day 시점별로 묶는다 */
export function groupItemsByDDay(items: ChecklistItem[]): Array<{ dDay: DDayCategory; items: ChecklistItem[] }> {
  return D_DAY_ORDER.map((dDay) => ({
    dDay,
    items: items.filter((item) => item.dDayCategory === dDay && !item.isCompleted),
  })).filter((group) => group.items.length > 0);
}

/**
 * 여행 출발일(startDateIso) 기준으로 D-30/D-14/D-7/D-1마다 아직 안 챙긴 준비물을
 * 알려주는 로컬 푸시 알림을 예약한다. items가 바뀔 때마다 다시 호출해 최신 상태로 갱신한다.
 */
export async function scheduleShoppingReminders(items: ChecklistItem[], startDateIso: string): Promise<void> {
  if (Platform.OS === 'web') return;

  for (const dDay of D_DAY_ORDER) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId(dDay));
    } catch {
      // 예약된 적 없으면 무시
    }
  }

  const groups = groupItemsByDDay(items);
  if (groups.length === 0) return;

  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  const now = new Date();
  for (const group of groups) {
    const fireDate = atLocalTime(startDateIso, D_DAY_OFFSETS[group.dDay], 9, 0);
    if (fireDate <= now) continue;

    const titles = group.items.map((i) => i.title).join(', ');
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(group.dDay),
      content: {
        title: `🛍️ ${group.dDay}, 이건 챙기셨나요?`,
        body: titles,
      },
      trigger: { date: fireDate },
    });
  }
}
