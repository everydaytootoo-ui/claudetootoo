import AsyncStorage from '@react-native-async-storage/async-storage';
import { PackTemplate } from '../types/models';

/**
 * ④ 패킹 리스트 템플릿 저장소.
 * 기기 로컬(AsyncStorage)에만 저장한다 — 템플릿은 "다음 여행 만들 때 1초 만에 불러오는" 개인용 자산이라
 * 매번 서버 왕복이 필요 없고, 오프라인에서도 즉시 저장/적용되는 게 더 중요하다.
 * (크루 전체와 템플릿을 공유하고 싶다면 supabase/schema.sql의 pack_templates 테이블로 확장하면 된다.)
 */
const STORAGE_KEY = 'packwith:pack_templates';

export async function listPackTemplates(): Promise<PackTemplate[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PackTemplate[];
  } catch {
    return [];
  }
}

export async function savePackTemplate(template: PackTemplate): Promise<void> {
  const templates = await listPackTemplates();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([template, ...templates]));
}

export async function deletePackTemplate(id: string): Promise<void> {
  const templates = await listPackTemplates();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates.filter((t) => t.id !== id)));
}
