import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/tokens';

export const StreamingCursor: React.FC = () => {
  const { colors } = useTheme();
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 450,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkAnim]);

  return (
    <Animated.Text
      style={[
        styles.inlineStreamingCursor,
        {
          color: colors.primary,
          opacity: blinkAnim,
        },
      ]}
      accessibilityLabel="Generating..."
    >
      {' ▋'}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  inlineStreamingCursor: {
    fontSize: typography.size.md,
    fontWeight: '900',
    lineHeight: 22,
  },
});
