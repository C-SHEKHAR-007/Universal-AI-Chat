import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Brain, ChevronDown, ChevronRight, Sparkles, Clock, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { StreamingCursor } from './StreamingCursor';

// Enable layout animation on Android if supported
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ThinkingProcessBlockProps {
  title?: string;
  bodyLines: string[];
  isThinkingActive: boolean;
  renderInline: (text: string, baseStyle?: any) => React.ReactNode;
}

export const ThinkingProcessBlock: React.FC<ThinkingProcessBlockProps> = ({
  title = 'Thinking Process',
  bodyLines,
  isThinkingActive,
  renderInline,
}) => {
  const { colors, isDark } = useTheme();
  const [isManualExpanded, setIsManualExpanded] = useState<boolean | null>(null);

  // When active thinking starts, reset manual toggle so live generation is always visible
  useEffect(() => {
    if (isThinkingActive) {
      setIsManualExpanded(null);
    }
  }, [isThinkingActive]);

  const isExpanded = isManualExpanded !== null ? isManualExpanded : isThinkingActive;

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsManualExpanded(!isExpanded);
  };

  const totalChars = bodyLines.reduce((acc, line) => acc + line.length, 0);
  const wordCount = bodyLines.join(' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.07)' : 'rgba(59, 130, 246, 0.05)',
          borderColor: isThinkingActive
            ? colors.primary
            : isDark
            ? 'rgba(59, 130, 246, 0.25)'
            : 'rgba(59, 130, 246, 0.2)',
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.header,
          isExpanded && {
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)',
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Toggle thinking process"
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isThinkingActive
                  ? colors.primaryMuted
                  : isDark
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(59, 130, 246, 0.1)',
              },
            ]}
          >
            <Brain size={14} color={colors.primary} />
          </View>
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>
            {title || 'Thinking Process'}
          </Text>

          {isThinkingActive ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.primaryMuted }]}>
              <View style={[styles.pulsingDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.statusBadgeText, { color: colors.primary }]}>Thinking...</Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Check size={11} color={colors.textSecondary} />
              <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                {wordCount > 0 ? `${wordCount} words` : 'Completed'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.toggleHintText, { color: colors.textMuted }]}>
            {isExpanded ? 'Collapse' : 'Show reasoning'}
          </Text>
          {isExpanded ? (
            <ChevronDown size={15} color={colors.textSecondary} />
          ) : (
            <ChevronRight size={15} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.body}>
          {bodyLines.map((line, idx) => {
            const isLastLine = idx === bodyLines.length - 1;
            return (
              <Text
                key={`think_${idx}`}
                style={[
                  styles.thinkingText,
                  { color: isDark ? 'rgba(230, 235, 245, 0.85)' : 'rgba(50, 60, 80, 0.9)' },
                ]}
              >
                {renderInline(line, [
                  styles.thinkingText,
                  { color: isDark ? 'rgba(230, 235, 245, 0.85)' : 'rgba(50, 60, 80, 0.9)' },
                ])}
                {isThinkingActive && isLastLine && <StreamingCursor />}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleHintText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.normal,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 4,
  },
  thinkingText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'normal',
  },
});
