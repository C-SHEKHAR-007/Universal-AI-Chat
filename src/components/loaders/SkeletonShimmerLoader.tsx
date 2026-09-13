import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { borderRadius } from '../../theme/tokens';
import { BaseLoaderProps } from './types';

export const SkeletonShimmerLoader: React.FC<BaseLoaderProps> = () => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: isNative,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: isNative,
        }),
      ])
    );

    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View
        style={[
          styles.skeletonLine,
          styles.skeletonLong,
          { backgroundColor: colors.borderLight, opacity: shimmerAnim },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonLine,
          styles.skeletonMedium,
          { backgroundColor: colors.borderLight, opacity: shimmerAnim },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonLine,
          styles.skeletonShort,
          { backgroundColor: colors.borderLight, opacity: shimmerAnim },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    width: '100%',
    maxWidth: 380,
    gap: 8,
    paddingVertical: 4,
  },
  skeletonLine: {
    height: 11,
    borderRadius: borderRadius.sm,
  },
  skeletonLong: {
    width: '92%',
  },
  skeletonMedium: {
    width: '76%',
  },
  skeletonShort: {
    width: '45%',
  },
});
