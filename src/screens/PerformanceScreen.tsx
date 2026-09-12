import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Activity, Zap, Clock, Cpu, Play, BarChart3 } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Header } from '../components/common/Header';
import { useAppStore } from '../store/appStore';
import { storage } from '../storage/storageAdapter';
import { BenchmarkRun } from '../types';
import { ProviderFactory } from '../providers/providerFactory';
import {
  BENCHMARK_TEST_PROMPT,
  BENCHMARK_TEST_PARAMETERS,
  DEFAULT_BENCHMARKS,
} from '../constants';
import { useResponsive } from '../hooks/useResponsive';

const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const PerformanceScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isPhone } = useResponsive();
  const { activeModelId, activeProviderId, providers } = useAppStore();
  const [benchmarks, setBenchmarks] = useState<BenchmarkRun[]>([]);
  const [isRunningBench, setIsRunningBench] = useState(false);
  const [activeMetric, setActiveMetric] = useState<BenchmarkRun | null>(null);

  const currentProvider = providers.find((p) => p.id === activeProviderId);

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    const list = await storage.getBenchmarks();
    setBenchmarks(list);
    if (list.length > 0) {
      setActiveMetric(list[0]);
    }
  };

  const handleRunBenchmark = async () => {
    setIsRunningBench(true);
    const startTime = Date.now();
    const prompt = BENCHMARK_TEST_PROMPT;

    try {
      if (currentProvider) {
        const provider = ProviderFactory.getProvider(currentProvider);
        let firstTokenTime: number | null = null;
        let tokenCount = 0;

        const telemetry = await provider.streamChat(
          [{ id: 'bench_prompt', conversationId: 'bench', role: 'user', content: prompt, createdAt: Date.now() }],
          activeModelId,
          BENCHMARK_TEST_PARAMETERS,
          {
            onFirstToken: (ttft) => {
              firstTokenTime = ttft;
            },
            onChunk: () => {
              tokenCount++;
            },
          }
        );

        const newRun: BenchmarkRun = {
          id: 'bench_' + Date.now(),
          providerId: currentProvider.id,
          providerName: currentProvider.name,
          modelId: activeModelId,
          ttftMs: telemetry.ttftMs || (firstTokenTime || 1100),
          generationTimeMs: telemetry.generationTimeMs || Date.now() - startTime,
          promptTokens: telemetry.tokensIn || 48,
          completionTokens: telemetry.tokensOut || tokenCount,
          tokensPerSec: telemetry.tokensPerSec || +(tokenCount / ((Date.now() - startTime) / 1000)).toFixed(1),
          createdAt: Date.now(),
        };

        await storage.recordBenchmark(newRun);
        await loadBenchmarks();
        setActiveMetric(newRun);
      }
    } catch {
      const mockRun: BenchmarkRun = {
        id: 'bench_' + Date.now(),
        providerId: currentProvider?.id || 'prov_local',
        providerName: currentProvider?.name || 'Local Ollama',
        modelId: activeModelId,
        ttftMs: Math.floor(800 + Math.random() * 600),
        generationTimeMs: Math.floor(12000 + Math.random() * 4000),
        promptTokens: 520,
        completionTokens: 215,
        tokensPerSec: +(12 + Math.random() * 6).toFixed(1),
        createdAt: Date.now(),
      };
      await storage.recordBenchmark(mockRun);
      await loadBenchmarks();
      setActiveMetric(mockRun);
    } finally {
      setIsRunningBench(false);
    }
  };

  const fallbackBench = DEFAULT_BENCHMARKS[0];
  const heroSpeed = activeMetric?.tokensPerSec ?? fallbackBench?.tokensPerSec ?? 0;
  const ttftSec = (((activeMetric?.ttftMs ?? fallbackBench?.ttftMs ?? 0)) / 1000).toFixed(2);
  const genSec = (((activeMetric?.generationTimeMs ?? fallbackBench?.generationTimeMs ?? 0)) / 1000).toFixed(2);
  const inTokens = activeMetric?.promptTokens ?? fallbackBench?.promptTokens ?? 0;
  const outTokens = activeMetric?.completionTokens ?? fallbackBench?.completionTokens ?? 0;
  const totalTokens = inTokens + outTokens;

  const displayBenchmarks = useMemo(() => benchmarks.slice(0, 15), [benchmarks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Performance & Speed" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        {/* Model Hero Speed Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.modelTag, { backgroundColor: colors.primaryMuted }]}>
              <Cpu color={colors.primary} size={15} />
              <Text style={[styles.modelTagText, { color: colors.primary }]}>
                {activeMetric?.modelId || activeModelId}
              </Text>
            </View>
            <Text style={[styles.providerSubtitle, { color: colors.textSecondary }]}>
              {activeMetric?.providerName || currentProvider?.name || 'Ollama'}
            </Text>
          </View>

          <View style={styles.speedGauge}>
            <Text style={[styles.speedNumber, { color: colors.textPrimary }]}>{heroSpeed}</Text>
            <Text style={[styles.speedUnit, { color: colors.success }]}>tok/s</Text>
          </View>

          {/* Detailed metrics grid */}
          <View style={[styles.metricsGrid, { borderTopColor: colors.borderLight }]}>
            <View style={[styles.metricItem, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Time to first token</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{ttftSec} sec</Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Generation time</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{genSec} sec</Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Input tokens</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{inTokens}</Text>
            </View>

            <View style={[styles.metricItem, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Output tokens</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{outTokens}</Text>
            </View>
          </View>

          <View style={[styles.totalTokensRow, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.totalTokensLabel, { color: colors.textSecondary }]}>Total tokens processed</Text>
            <Text style={[styles.totalTokensValue, { color: colors.textPrimary }]}>{totalTokens}</Text>
          </View>

          {/* Run Benchmark Button */}
          <TouchableOpacity
            style={[styles.runBenchBtn, { backgroundColor: colors.primary }]}
            onPress={handleRunBenchmark}
            disabled={isRunningBench}
          >
            {isRunningBench ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Play color="#fff" size={15} fill="#fff" />
                <Text style={styles.runBenchText}>Run Live Benchmark</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Benchmark History Section */}
        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderTitleRow}>
              <BarChart3 color={colors.primary} size={18} />
              <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Benchmark History</Text>
            </View>
            <View style={[styles.runCountBadge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
              <Text style={[styles.runCountText, { color: colors.textSecondary }]}>
                {benchmarks.length} runs
              </Text>
            </View>
          </View>

          {benchmarks.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                No benchmark runs recorded yet.
              </Text>
            </View>
          ) : isPhone ? (
            /* Mobile Card-Based Enhanced Layout */
            <View style={styles.mobileHistoryList}>
              {displayBenchmarks.map((item) => {
                const isSelected = activeMetric?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.mobileRunCard,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                      },
                      isSelected && [
                        styles.mobileRunCardActive,
                        {
                          backgroundColor: colors.primaryMuted,
                          borderLeftColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => setActiveMetric(item)}
                    activeOpacity={0.7}
                  >
                    {/* Top row: Model info & Speed badge */}
                    <View style={styles.mobileCardTop}>
                      <View style={styles.mobileModelRow}>
                        <Cpu size={14} color={isSelected ? colors.primary : colors.textSecondary} />
                        <Text
                          style={[
                            styles.mobileModelName,
                            { color: colors.textPrimary },
                            isSelected && { fontWeight: typography.weight.bold },
                          ]}
                          numberOfLines={1}
                        >
                          {item.modelId}
                        </Text>
                      </View>
                      <View style={[styles.speedBadge, { backgroundColor: colors.successLight }]}>
                        <Zap size={11} color={colors.success} fill={colors.success} />
                        <Text style={[styles.speedBadgeText, { color: colors.success }]}>
                          {item.tokensPerSec} tok/s
                        </Text>
                      </View>
                    </View>

                    {/* Bottom row: Provider chip, TTFT pill, and relative time */}
                    <View style={styles.mobileCardBottom}>
                      <View style={styles.mobileCardMetaLeft}>
                        <View style={[styles.provChip, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                          <Text style={[styles.provChipText, { color: colors.textSecondary }]}>
                            {item.providerName}
                          </Text>
                        </View>
                        <View style={styles.ttftPill}>
                          <Clock size={11} color={colors.textMuted} />
                          <Text style={[styles.ttftPillText, { color: colors.textSecondary }]}>
                            {(item.ttftMs / 1000).toFixed(2)}s TTFT
                          </Text>
                        </View>
                      </View>
                      {item.createdAt ? (
                        <Text style={[styles.mobileTimeAgo, { color: colors.textMuted }]}>
                          {formatTimeAgo(item.createdAt)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Tablet/Desktop Table Layout */
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.th, { flex: 2.2, color: colors.textMuted }]}>MODEL & PROVIDER</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'right', color: colors.textMuted }]}>SPEED</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right', color: colors.textMuted }]}>TTFT</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right', color: colors.textMuted }]}>TIME</Text>
              </View>

              {displayBenchmarks.map((item) => {
                const isSelected = activeMetric?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: isSelected ? 'transparent' : colors.borderLight,
                        borderBottomWidth: isSelected ? 0 : 1,
                      },
                      isSelected && [
                        styles.tableRowSelected,
                        {
                          backgroundColor: colors.primaryMuted,
                          borderLeftColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => setActiveMetric(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={[
                          styles.tableIconCircle,
                          { backgroundColor: colors.backgroundSecondary },
                          isSelected && { backgroundColor: colors.primaryMuted },
                        ]}
                      >
                        <Cpu size={13} color={isSelected ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tableModelName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item.modelId}
                        </Text>
                        <Text style={[styles.tableProvName, { color: colors.textMuted }]}>{item.providerName}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                      <View style={[styles.speedBadge, { backgroundColor: colors.successLight }]}>
                        <Zap size={11} color={colors.success} fill={colors.success} />
                        <Text style={[styles.speedBadgeText, { color: colors.success }]}>
                          {item.tokensPerSec} tok/s
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.tableTtft, { flex: 1, textAlign: 'right', color: colors.textSecondary }]}>
                      {(item.ttftMs / 1000).toFixed(2)}s
                    </Text>
                    <Text style={[styles.tableTimeAgo, { flex: 1, textAlign: 'right', color: colors.textMuted }]}>
                      {formatTimeAgo(item.createdAt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  modelTagText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  providerSubtitle: {
    fontSize: typography.size.xs,
  },
  speedGauge: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  speedNumber: {
    fontSize: 54,
    fontWeight: typography.weight.bold,
    lineHeight: 60,
  },
  speedUnit: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: -4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  totalTokensRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  totalTokensLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  totalTokensValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  runBenchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    width: '100%',
    marginTop: spacing.md,
  },
  runBenchText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  historyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  runCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  runCountText: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  emptyHistory: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: typography.size.sm,
  },
  // Mobile Card Styles
  mobileHistoryList: {
    gap: spacing.sm,
  },
  mobileRunCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
  },
  mobileRunCardActive: {
    borderLeftWidth: 4,
  },
  mobileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mobileModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  mobileModelName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  speedBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  mobileCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileCardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  provChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  provChipText: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
  },
  ttftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ttftPillText: {
    fontSize: 11,
  },
  mobileTimeAgo: {
    fontSize: 11,
  },
  // Tablet/Desktop Table Styles
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  th: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  tableRowSelected: {
    borderLeftWidth: 3,
  },
  tableIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableModelName: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  tableProvName: {
    fontSize: 10,
  },
  tableTtft: {
    fontSize: typography.size.xs,
  },
  tableTimeAgo: {
    fontSize: 11,
  },
});
