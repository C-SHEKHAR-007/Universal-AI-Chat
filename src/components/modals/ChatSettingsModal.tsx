import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Sliders, ChevronDown, RotateCcw, HardDrive } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { DEFAULT_PARAMETERS } from '../../storage/storageAdapter';
import { calculateContextMetrics } from '../../utils/contextManager';

export const ChatSettingsModal: React.FC = () => {
  const { colors } = useTheme();
  const {
    isChatSettingsOpen,
    setChatSettingsOpen,
    chatParameters,
    setChatParameters,
    activeModelId,
    setModelSelectorOpen,
    activeConversation,
    activeConversationId,
    updateConversationTitle,
  } = useAppStore();
  const { messages } = useChatStore();

  const [chatTitle, setChatTitle] = useState(activeConversation?.title || '');
  const [temp, setTemp] = useState(chatParameters.temperature);
  const [topP, setTopP] = useState(chatParameters.topP);
  const [maxTokens, setMaxTokens] = useState(chatParameters.maxTokens.toString());
  const [contextWin, setContextWin] = useState(chatParameters.contextWindow.toString());
  const [systemPrompt, setSystemPrompt] = useState(chatParameters.systemPrompt);

  useEffect(() => {
    if (activeConversation) {
      setChatTitle(activeConversation.title);
    }
  }, [activeConversation?.title]);

  if (!isChatSettingsOpen) return null;

  const currentCtxLimit = parseInt(contextWin, 10) || 8192;
  const metrics = calculateContextMetrics(messages, {
    ...chatParameters,
    contextWindow: currentCtxLimit,
    systemPrompt,
  });

  const handleSave = () => {
    if (activeConversationId && chatTitle.trim() && chatTitle.trim() !== activeConversation?.title) {
      updateConversationTitle(activeConversationId, chatTitle.trim(), true);
    }
    setChatParameters({
      temperature: temp,
      topP,
      maxTokens: parseInt(maxTokens, 10) || 4096,
      contextWindow: parseInt(contextWin, 10) || 8192,
      systemPrompt,
    });
    setChatSettingsOpen(false);
  };

  const handleReset = () => {
    setTemp(DEFAULT_PARAMETERS.temperature);
    setTopP(DEFAULT_PARAMETERS.topP);
    setMaxTokens(DEFAULT_PARAMETERS.maxTokens.toString());
    setContextWin(DEFAULT_PARAMETERS.contextWindow.toString());
    setSystemPrompt(DEFAULT_PARAMETERS.systemPrompt);
  };

  return (
    <Modal visible={isChatSettingsOpen} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sliders color={colors.primary} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Chat Settings</Text>
            </View>
            <TouchableOpacity
              onPress={() => setChatSettingsOpen(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Chat Title */}
            {activeConversation && (
              <View style={styles.settingGroup}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Chat Title</Text>
                <TextInput
                  style={[
                    styles.numericInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderLight,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={chatTitle}
                  onChangeText={setChatTitle}
                  placeholder="Conversation title"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {/* Model Card Trigger */}
            <View style={styles.settingGroup}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Model</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => {
                  setChatSettingsOpen(false);
                  setModelSelectorOpen(true);
                }}
              >
                <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{activeModelId}</Text>
                <ChevronDown color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            {/* Live Context Window & Memory Health */}
            <View style={[styles.contextCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
              <View style={styles.contextHeaderRow}>
                <View style={styles.contextTitleRow}>
                  <HardDrive size={16} color={colors.primary} />
                  <Text style={[styles.contextTitle, { color: colors.textPrimary }]}>Live Context Memory</Text>
                </View>
                <Text
                  style={[
                    styles.contextBadge,
                    {
                      backgroundColor: metrics.utilizationPercent > 85 ? colors.dangerLight : colors.primaryMuted,
                      color: metrics.utilizationPercent > 85 ? colors.danger : colors.primary,
                    },
                  ]}
                >
                  {metrics.totalTokens.toLocaleString()} / {currentCtxLimit.toLocaleString()} tok ({metrics.utilizationPercent}%)
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(2, metrics.utilizationPercent))}%`,
                      backgroundColor:
                        metrics.utilizationPercent > 85
                          ? colors.danger
                          : metrics.utilizationPercent > 60
                          ? colors.warning
                          : colors.primary,
                    },
                  ]}
                />
              </View>

              {/* Sub-tokens breakdown */}
              <View style={styles.contextBreakdownRow}>
                <Text style={[styles.contextSubText, { color: colors.textSecondary }]}>
                  System: {metrics.systemTokens} tok • History: {metrics.conversationTokens} tok ({messages.length} turns)
                </Text>
              </View>

              {/* Context Presets */}
              <View style={styles.contextPresetsRow}>
                {[8192, 32768, 65536, 100000, 131072].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: currentCtxLimit === size ? colors.primary : colors.borderLight,
                      },
                      currentCtxLimit === size && { backgroundColor: colors.primaryMuted },
                    ]}
                    onPress={() => setContextWin(size.toString())}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: currentCtxLimit === size ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {size >= 1000 ? `${Math.round(size / 1000)}k` : size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Temperature */}
            <View style={styles.settingGroup}>
              <View style={styles.labelValueRow}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Temperature</Text>
                <Text
                  style={[
                    styles.valueBadge,
                    {
                      color: colors.primary,
                      backgroundColor: colors.primaryMuted,
                    },
                  ]}
                >
                  {temp.toFixed(1)}
                </Text>
              </View>
              <View style={styles.sliderControlRow}>
                {[0.2, 0.5, 0.7, 1.0, 1.2, 1.5].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.stepperChip,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderLight,
                      },
                      temp === val && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setTemp(val)}
                  >
                    <Text
                      style={[
                        styles.stepperChipText,
                        { color: temp === val ? '#fff' : colors.textSecondary },
                        temp === val && styles.stepperChipTextActive,
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Top P */}
            <View style={styles.settingGroup}>
              <View style={styles.labelValueRow}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Top P</Text>
                <Text
                  style={[
                    styles.valueBadge,
                    {
                      color: colors.primary,
                      backgroundColor: colors.primaryMuted,
                    },
                  ]}
                >
                  {topP.toFixed(1)}
                </Text>
              </View>
              <View style={styles.sliderControlRow}>
                {[0.5, 0.7, 0.9, 0.95, 1.0].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.stepperChip,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderLight,
                      },
                      topP === val && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setTopP(val)}
                  >
                    <Text
                      style={[
                        styles.stepperChipText,
                        { color: topP === val ? '#fff' : colors.textSecondary },
                        topP === val && styles.stepperChipTextActive,
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Output Tokens & Context Window */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.settingGroup, { flex: 1 }]}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Max Output Tokens</Text>
                <TextInput
                  style={[
                    styles.numericInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderLight,
                      color: colors.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  value={maxTokens}
                  onChangeText={setMaxTokens}
                  placeholder="4096"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.settingGroup, { flex: 1 }]}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Context Window</Text>
                <TextInput
                  style={[
                    styles.numericInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderLight,
                      color: colors.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  value={contextWin}
                  onChangeText={setContextWin}
                  placeholder="100000"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Context Window Presets */}
            <View style={[styles.settingGroup, { marginTop: -6 }]}>
              <Text style={[styles.groupLabel, { color: colors.textMuted, fontSize: 11 }]}>Presets</Text>
              <View style={styles.sliderControlRow}>
                {[
                  { label: '8k', val: '8192' },
                  { label: '32k', val: '32768' },
                  { label: '64k', val: '65536' },
                  { label: '100k (Default)', val: '100000' },
                  { label: '128k', val: '131072' },
                ].map((preset) => {
                  const isSelected = contextWin === preset.val;
                  return (
                    <TouchableOpacity
                      key={preset.val}
                      style={[
                        styles.stepperChip,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.borderLight,
                        },
                        isSelected && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setContextWin(preset.val)}
                    >
                      <Text
                        style={[
                          styles.stepperChipText,
                          { color: isSelected ? '#fff' : colors.textSecondary, fontSize: 11 },
                          isSelected && styles.stepperChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* System Prompt */}
            <View style={styles.settingGroup}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>System Prompt</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                multiline
                numberOfLines={4}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Enter system instructions..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.borderLight }]}
              onPress={handleReset}
            >
              <RotateCcw color={colors.textSecondary} size={16} />
              <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 460,
  },
  settingGroup: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  dropdownText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  sliderControlRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  stepperChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  stepperChipTextActive: {
    fontWeight: typography.weight.bold,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numericInput: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: typography.size.sm,
  },
  textArea: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 80,
    fontSize: typography.size.sm,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: typography.size.sm,
  },
  saveBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },

  // Live Context Memory Card
  contextCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 8,
    marginBottom: spacing.md,
  },
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  contextBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  contextBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contextSubText: {
    fontSize: 11,
  },
  contextPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
});
