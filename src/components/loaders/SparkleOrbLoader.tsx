import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/tokens';
import { BaseLoaderProps } from './types';

export const SparkleOrbLoader: React.FC<BaseLoaderProps> = ({ modelName }) => {
  const { colors } = useTheme();

  const pulseScale = useRef(new Animated.Value(0.9)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';

    const pulseLoop = Animated.loop(
      Animated.parallel([
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
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: isNative,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: isNative,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseScale, glowOpacity]);

  return (
    <View style={styles.sparkleContainer}>
      <View style={styles.sparkleOrbWrapper}>
        <Animated.View
          style={[
            styles.sparkleGlow,
            {
              backgroundColor: colors.primaryMuted,
              transform: [{ scale: pulseScale }],
              opacity: glowOpacity,
            },
          ]}
        />
        <View style={[styles.sparkleIconBox, { backgroundColor: colors.primary }]}>
          <Sparkles size={14} color="#fff" />
        </View>
      </View>
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        {modelName ? `${modelName} is generating...` : 'Generating response...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sparkleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  sparkleOrbWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sparkleIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
