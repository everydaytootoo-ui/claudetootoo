/**
 * AdMob 수익화 지점
 *  - 보상형(Rewarded): 한정판 스티커/테마 해금, 히든포켓 무제한 추가
 *  - 전면(Interstitial): 짐싸기 완료 / 인스타 자랑용 카드 저장 완료 시 노출
 *
 * react-native-google-mobile-ads는 커스텀 네이티브 코드가 필요해 Expo Go에서는
 * 동작하지 않는다(개발 빌드/EAS Build 필요). require를 지연 + try/catch로 감싸서
 * Expo Go 같은 환경에서는 앱이 크래시하는 대신 광고 기능만 조용히 꺼지도록 한다.
 */
type AdsSdk = typeof import('react-native-google-mobile-ads');
let sdk: AdsSdk | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sdk = require('react-native-google-mobile-ads');
} catch {
  sdk = null;
}

/** 실제 광고 단위 ID는 배포 전 app.json(extra) 또는 환경변수로 주입하고, 개발 빌드에서는 TestIds를 사용한다. */
const REWARDED_UNIT_ID = __DEV__ ? sdk?.TestIds.REWARDED : 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ID';
const INTERSTITIAL_UNIT_ID = __DEV__
  ? sdk?.TestIds.INTERSTITIAL
  : 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID';

let initialized = false;

export async function initializeAds(): Promise<void> {
  if (initialized || !sdk) return;
  await sdk.MobileAds().initialize();
  initialized = true;
}

type UnlockReason = 'premium_sticker' | 'premium_theme' | 'unlimited_hidden_pocket';

/**
 * 보상형 광고를 로드→노출하고, 유저가 끝까지 시청해 보상을 획득했을 때만
 * onRewardEarned를 호출한다 (중도 이탈 시 잠금 해제되지 않음).
 */
export function showRewardedAdForUnlock(
  reason: UnlockReason,
  onRewardEarned: () => void,
  onFailed?: (error: unknown) => void
): void {
  if (!sdk || !REWARDED_UNIT_ID) {
    onFailed?.(new Error('이 환경(Expo Go 등)에서는 광고 기능을 사용할 수 없어요.'));
    return;
  }
  const { AdEventType, RewardedAd, RewardedAdEventType } = sdk;

  const rewarded = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });

  let earned = false;

  const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewarded.show();
  });
  const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    earned = true;
    onRewardEarned();
  });
  const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
    unsubscribeError();
    if (!earned) onFailed?.(new Error(`${reason} 보상형 광고 시청이 완료되지 않았어요.`));
  });
  const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
    unsubscribeError();
    onFailed?.(error);
  });

  rewarded.load();
}

/** 세션(앱을 다시 켤 때까지)당 전면 광고 노출 횟수 상한 — 짧은 시간에 반복 노출되어 피로감을 주지 않도록 */
const MAX_INTERSTITIALS_PER_SESSION = 2;
let interstitialShowCount = 0;

/** 짐싸기 완료 / 공유 카드 저장 완료 등 자연스러운 완료 시점에 노출하는 전면 광고 */
export function showInterstitialAfterCompletion(onClosed?: () => void): void {
  if (!sdk || !INTERSTITIAL_UNIT_ID || interstitialShowCount >= MAX_INTERSTITIALS_PER_SESSION) {
    onClosed?.();
    return;
  }
  interstitialShowCount += 1;
  const { AdEventType, InterstitialAd } = sdk;

  const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });

  const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitial.show();
  });
  const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    unsubscribeLoaded();
    unsubscribeClosed();
    unsubscribeError();
    onClosed?.();
  });
  const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
    // 광고 로드 실패 시에도 유저 플로우는 막지 않는다.
    unsubscribeLoaded();
    unsubscribeClosed();
    unsubscribeError();
    onClosed?.();
  });

  interstitial.load();
}
