import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Brain, Lightbulb, Code2, BarChart2, BookOpen } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface EmptyChatStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onSelectPrompt }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSingleCol = width < 340;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const promptCards = [
    {
      title: 'Explain something',
      subtitle: 'Pods, architecture & concepts',
      prompt: 'Explain Kubernetes architecture, pods, and lifecycle in simple intuitive terms.',
      icon: <Lightbulb color={colors.primary} size={20} strokeWidth={2} />,
      iconBg: colors.primaryMuted,
    },
    {
      title: 'Write code',
      subtitle: 'Functions, hooks & debug',
      prompt: 'Write a TypeScript function to stream SSE tokens and calculate live tokens per second.',
      icon: <Code2 color={colors.purple} size={20} strokeWidth={2} />,
      iconBg: colors.purpleLight,
    },
    {
      title: 'Analyze data',
      subtitle: 'Benchmarks & metrics',
      prompt: 'Help me benchmark local model quantization trade-offs between 4-bit and 8-bit weights.',
      icon: <BarChart2 color={colors.success} size={20} strokeWidth={2} />,
      iconBg: colors.successLight,
    },
    {
      title: 'Learn something',
      subtitle: 'Tutorials & fast research',
      prompt: 'What are the top hardware acceleration techniques for running Ollama models at peak speed?',
      icon: <BookOpen color={colors.warning} size={20} strokeWidth={2} />,
      iconBg: colors.warningLight,
    },
  ];

  const renderCard = (
    card: (typeof promptCards)[0],
    positionStyle?: any
  ) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        positionStyle,
      ]}
      onPress={() => onSelectPrompt(card.prompt)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrapper, { backgroundColor: card.iconBg }]}>
        {card.icon}
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {card.title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {card.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero Branding */}
      <View style={styles.heroSection}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.borderHighlight,
            },
          ]}
        >
          <Brain color={colors.primary} size={38} strokeWidth={1.9} />
        </View>
        <Text style={[styles.heroGreeting, { color: colors.primary }]}>{greeting}</Text>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>How can I help you today?</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Ask anything, explore ideas, solve problems, or just chat.
        </Text>
      </View>

      {/* Prompt Cards: Explicit 2-row layout with margin spacing (No flexWrap, No Yoga gap bugs) */}
      <View style={styles.cardsContainer}>
        {isSingleCol ? (
          <>
            {promptCards.map((card, idx) => (
              <View key={idx} style={styles.singleRow}>
                {renderCard(card)}
              </View>
            ))}
          </>
        ) : (
          <>
            {/* Row 1: Explain something + Write code */}
            <View style={styles.row}>
              {renderCard(promptCards[0], styles.cardLeft)}
              {renderCard(promptCards[1], styles.cardRight)}
            </View>

            {/* Row 2: Analyze data + Learn something */}
            <View style={styles.row}>
              {renderCard(promptCards[2], styles.cardLeft)}
              {renderCard(promptCards[3], styles.cardRight)}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroGreeting: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
  cardsContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  singleRow: {
    width: '100%',
    marginBottom: 10,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  cardLeft: {
    marginRight: 5,
  },
  cardRight: {
    marginLeft: 5,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
});
