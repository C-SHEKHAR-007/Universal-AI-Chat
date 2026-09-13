import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/tokens';
import { BaseLoaderProps } from './types';

export const GradientPulseLoader: React.FC<BaseLoaderProps> = () => {
  const { colors } = useTheme();
  const lineSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';

    const lineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineSlide, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: isNative,
        }),
        Animated.timing(lineSlide, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: isNative,
        }),
      ])
    );

    lineLoop.start();
    return () => lineLoop.stop();
  }, [lineSlide]);

  const slideLeft = lineSlide.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'],
  });

  return (
    <View style={styles.gradientLineContainer}>
      <View style={[styles.gradientTrack, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.gradientThumb,
            {
              backgroundColor: colors.primary,
              left: slideLeft as any,
            },
          ]}
        />
      </View>
      <View style={styles.gradientCaptionRow}>
        <Zap size={11} color={colors.textMuted} />
        <Text style={[styles.gradientCaption, { color: colors.textMuted }]}>
          Connecting to model...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientLineContainer: {
    width: '100%',
    maxWidth: 260,
    gap: 6,
    paddingVertical: 6,
  },
  gradientTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '28%',
    borderRadius: 2,
  },
  gradientCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradientCaption: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
});
