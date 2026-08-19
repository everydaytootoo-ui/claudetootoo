import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { DecorationAsset, StickerPlacement } from '../../types/models';

interface Props {
  asset: DecorationAsset | null;
  /** 카탈로그 자산 대신 유저가 직접 입력한 텍스트/이모지 — 있으면 asset보다 우선해서 그린다 */
  customText?: string;
  placement: StickerPlacement;
  canvasSize: { width: number; height: number };
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** 정규화(0~1) 좌표/회전/스케일로 변환해 상위로 커밋 (드래그가 끝날 때마다 호출) */
  onCommit: (id: string, next: Pick<StickerPlacement, 'x' | 'y' | 'rotation' | 'scale'>) => void;
  onRemove: (id: string) => void;
}

const BASE_SIZE = 64;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

export function DraggableSticker({
  asset,
  customText,
  placement,
  canvasSize,
  isSelected,
  onSelect,
  onCommit,
  onRemove,
}: Props) {
  const translateX = useSharedValue(placement.x * canvasSize.width);
  const translateY = useSharedValue(placement.y * canvasSize.height);
  const rotation = useSharedValue(placement.rotation);
  const scale = useSharedValue(placement.scale);

  // 다른 세션/기기에서 갱신된 placement 값이 들어오면 애니메이션 값 동기화
  useEffect(() => {
    translateX.value = withTiming(placement.x * canvasSize.width);
    translateY.value = withTiming(placement.y * canvasSize.height);
    rotation.value = withTiming(placement.rotation);
    scale.value = withTiming(placement.scale);
  }, [placement.x, placement.y, placement.rotation, placement.scale, canvasSize.width, canvasSize.height]);

  const commitToParent = () => {
    const nextX = translateX.value / canvasSize.width;
    const nextY = translateY.value / canvasSize.height;
    onCommit(placement.id, {
      x: Math.min(1, Math.max(0, nextX)),
      y: Math.min(1, Math.max(0, nextY)),
      rotation: rotation.value,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value)),
    });
  };

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startRotation = useSharedValue(0);
  const startScale = useSharedValue(1);

  const tap = Gesture.Tap().onStart(() => {
    runOnJS(onSelect)(placement.id);
  });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(onSelect)(placement.id);
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(commitToParent)();
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale.value * e.scale));
    })
    .onEnd(() => {
      runOnJS(commitToParent)();
    });

  const rotate = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRotation.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(commitToParent)();
    });

  const composed = Gesture.Simultaneous(pan, pinch, rotate, tap);

  // 핀치 제스처는 마우스로는 쓸 수 없어(특히 웹) 눌러서 크기를 바꾸는 명시적 버튼도 함께 둔다
  const SCALE_STEP = 0.15;
  const bumpScale = (delta: number) => {
    scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta));
    commitToParent();
  };

  const displayText = customText ?? asset?.emoji;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - BASE_SIZE / 2 },
      { translateY: translateY.value - BASE_SIZE / 2 },
      { rotateZ: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <View style={[styles.stickerBox, isSelected && styles.stickerBoxSelected]}>
          {displayText ? (
            <Text
              style={[styles.emoji, displayText.length > 4 ? styles.emojiSmall : displayText.length > 2 && styles.emojiMedium]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayText}
            </Text>
          ) : (
            <Animated.Image source={{ uri: asset?.imageUrl }} style={styles.image} />
          )}
        </View>
        {isSelected && (
          <>
            <Text
              style={styles.removeBadge}
              onPress={() => onRemove(placement.id)}
              accessibilityLabel={`${asset?.label ?? customText} 삭제`}
            >
              ✕
            </Text>
            <Text style={styles.shrinkBadge} onPress={() => bumpScale(-SCALE_STEP)} accessibilityLabel="스티커 작게">
              －
            </Text>
            <Text style={styles.growBadge} onPress={() => bumpScale(SCALE_STEP)} accessibilityLabel="스티커 크게">
              ＋
            </Text>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: BASE_SIZE,
    height: BASE_SIZE,
  },
  stickerBox: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  stickerBoxSelected: {
    borderWidth: 2,
    borderColor: '#FF8A5B',
    borderStyle: 'dashed',
  },
  emoji: { fontSize: 40 },
  emojiMedium: { fontSize: 22 },
  emojiSmall: { fontSize: 14 },
  image: { width: BASE_SIZE - 8, height: BASE_SIZE - 8, resizeMode: 'contain' },
  removeBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3A3A3E',
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
    fontSize: 12,
  },
  shrinkBadge: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF8A5B',
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '700',
  },
  growBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF8A5B',
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '700',
  },
});
