import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Brain } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { borderRadius, typography } from '../../theme/tokens';
import { BaseLoaderProps } from './types';

export const ReasoningTimerLoader: React.FC<BaseLoaderProps> = () => {
  const { colors } = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const startTime = Date.now();
    const timerId = setInterval(() => {
      setElapsedSeconds((Date.now() - startTime) / 1000);
    }, 100);

    const isNative = Platform.OS !== 'web';
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
        Animated.timing(pulseScale, {
          toValue: 0.9,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      clearInterval(timerId);
      pulseLoop.stop();
    };
  }, [pulseScale]);

  return (
    <View
      style={[
        styles.timerPill,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.timerIconWrap,
          {
            backgroundColor: colors.primaryMuted,
            transform: [{ scale: pulseScale }],
          },
        ]}
      >
        <Brain size={13} color={colors.primary} />
      </Animated.View>
      <Text style={[styles.timerTitle, { color: colors.textPrimary }]}>
        Thinking
      </Text>
      <View style={[styles.timerDivider, { backgroundColor: colors.borderLight }]} />
      <Text style={[styles.timerCount, { color: colors.primary }]}>
        {elapsedSeconds.toFixed(1)}s
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginVertical: 4,
  },
  timerIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTitle: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  timerDivider: {
    width: 1,
    height: 12,
  },
  timerCount: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
});
