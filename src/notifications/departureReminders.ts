import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Trip } from '../types/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const D1_REMINDER_ID = 'packwith-departure-d1';
const DDAY_REMINDER_ID = 'packwith-departure-dday';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function atLocalTime(dateIso: string, hour: number, minute: number, dayOffset: number): Date {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * ③ 출발 D-1 저녁(18:00) / D-Day 오전(07:00) 필수품 미챙김 알림 예약.
 * items 상태가 바뀔 때마다 다시 호출해 최신 미체크 개수로 갱신(취소 후 재예약)한다.
 * uncheckedEssentialCount가 0이면 예약된 알림을 모두 취소한다(다 챙겼으니 알릴 필요 없음).
 */
export async function scheduleDepartureReminders(trip: Trip, uncheckedEssentialCount: number): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(D1_REMINDER_ID);
  } catch {
    // 예약된 적 없으면 무시
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(DDAY_REMINDER_ID);
  } catch {
    // 예약된 적 없으면 무시
  }

  if (uncheckedEssentialCount <= 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const now = new Date();
  const body = `여권, 보조배터리 등 아직 체크되지 않은 필수품 ${uncheckedEssentialCount}개가 있습니다.`;

  const d1Date = atLocalTime(trip.startDate, 18, 0, -1);
  if (d1Date > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: D1_REMINDER_ID,
      content: { title: '🧳 출발 하루 전이에요', body },
      trigger: { date: d1Date },
    });
  }

  const ddayDate = atLocalTime(trip.startDate, 7, 0, 0);
  if (ddayDate > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: DDAY_REMINDER_ID,
      content: { title: '✈️ 오늘 출발이에요!', body },
      trigger: { date: ddayDate },
    });
  }
}
