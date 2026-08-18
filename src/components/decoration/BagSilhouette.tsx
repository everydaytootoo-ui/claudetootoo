import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { BagKind } from '../../types/models';

interface Props {
  kind: BagKind;
  colorHex: string;
}

/** 가방 종류별 2D 실루엣. 실제 프로덕션에서는 SVG 일러스트 에셋으로 교체 가능. */
export function BagSilhouette({ kind, colorHex }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 320 420">
        {kind === 'backpack' ? (
          <Path
            d="M100 60 Q100 20 160 20 Q220 20 220 60 L220 100 Q260 110 260 160 L260 380 Q260 400 240 400 L80 400 Q60 400 60 380 L60 160 Q60 110 100 100 Z"
            fill={colorHex}
            stroke="#00000014"
            strokeWidth={2}
          />
        ) : kind === 'boston' ? (
          <Path
            d="M40 140 Q40 100 90 100 L230 100 Q280 100 280 140 L280 320 Q280 360 230 360 L90 360 Q40 360 40 320 Z"
            fill={colorHex}
            stroke="#00000014"
            strokeWidth={2}
          />
        ) : (
          // carryon 20/24/28 — 세로 캐리어 실루엣 (높이 비율만 종류에 따라 다르게)
          <>
            <Rect
              x={40}
              y={kind === 'carryon28' ? 40 : kind === 'carryon24' ? 60 : 80}
              width={240}
              height={kind === 'carryon28' ? 340 : kind === 'carryon24' ? 320 : 300}
              rx={28}
              fill={colorHex}
              stroke="#00000014"
              strokeWidth={2}
            />
            <Rect x={140} y={20} width={40} height={30} rx={8} fill="#00000022" />
          </>
        )}
      </Svg>
    </View>
  );
}
