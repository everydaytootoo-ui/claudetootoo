import {
  AdEventType,
  InterstitialAd,
  MobileAds,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

/**
 * AdMob 수익화 지점
 *  - 보상형(Rewarded): 한정판 스티커/테마 해금, 히든포켓 무제한 추가
 *  - 전면(Interstitial): 짐싸기 완료 / 인스타 자랑용 카드 저장 완료 시 노출
 *
 * 실제 광고 단위 ID는 배포 전 app.json(extra) 또는 환경변수로 주입하고,
 * 개발/디버그 빌드에서는 TestIds를 사용해 정책 위반을 방지한다.
 */
const REWARDED_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ID';
const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID';

let initialized = false;

export async function initializeAds(): Promise<void> {
  if (initialized) return;
  await MobileAds().initialize();
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

/** 짐싸기 완료 / 공유 카드 저장 완료 등 자연스러운 완료 시점에 노출하는 전면 광고 */
export function showInterstitialAfterCompletion(onClosed?: () => void): void {
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
