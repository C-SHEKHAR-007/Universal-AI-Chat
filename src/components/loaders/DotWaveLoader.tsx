import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/tokens';
import { BaseLoaderProps } from './types';

export const DotWaveLoader: React.FC<BaseLoaderProps> = () => {
  const { colors } = useTheme();

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';

    const createDotAnim = (animVal: Animated.Value, delayMs: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(animVal, {
            toValue: -6,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.timing(animVal, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.delay(300),
        ])
      );
    };

    const dotLoop1 = createDotAnim(dot1, 0);
    const dotLoop2 = createDotAnim(dot2, 160);
    const dotLoop3 = createDotAnim(dot3, 320);

    dotLoop1.start();
    dotLoop2.start();
    dotLoop3.start();

    return () => {
      dotLoop1.stop();
      dotLoop2.stop();
      dotLoop3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotWaveContainer}>
      <View style={styles.dotGroup}>
        <Animated.View
          style={[
            styles.waveDot,
            { backgroundColor: colors.primary, transform: [{ translateY: dot1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.waveDot,
            { backgroundColor: colors.primary, transform: [{ translateY: dot2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.waveDot,
            { backgroundColor: colors.primary, transform: [{ translateY: dot3 }] },
          ]}
        />
      </View>
      <Text style={[styles.statusText, { color: colors.textMuted }]}>
        Thinking...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dotWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 16,
  },
  waveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
