import { BagKind } from '../types/models';

export const BAG_KIND_LABEL: Record<BagKind, string> = {
  carryon20: '20인치 캐리어',
  carryon24: '24인치 캐리어',
  carryon28: '28인치 캐리어',
  backpack: '백팩',
  boston: '보스턴백',
};

export const BAG_KIND_ICON: Record<BagKind, string> = {
  carryon20: '🧳',
  carryon24: '🧳',
  carryon28: '🧳',
  backpack: '🎒',
  boston: '👜',
};

export const BAG_KIND_OPTIONS: BagKind[] = ['carryon20', 'carryon24', 'carryon28', 'backpack', 'boston'];
