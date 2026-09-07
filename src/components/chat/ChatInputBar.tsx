import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Plus, ArrowUp, Square, Settings2, Sparkles, ChevronRight, X } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { Tooltip } from '../common/Tooltip';

interface ChatInputBarProps {
  onSend: (text: string) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { colors, isDark } = useTheme();
  const { isStreaming, stopGeneration, inputDraft, setInputDraft } = useChatStore();
  const {
    activeModelId,
    activeProviderId,
    providers,
    setModelSelectorOpen,
    setChatSettingsOpen,
  } = useAppStore();

  useEffect(() => {
    if (inputDraft) {
      setText(inputDraft);
      setInputDraft('');
    }
  }, [inputDraft]);

  const currentProvider = providers.find((p) => p.id === activeProviderId);

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e: any) => {
    // On web, handle Enter to send and Shift+Enter for newline
    if (e?.nativeEvent?.key === 'Enter' && !e?.nativeEvent?.shiftKey) {
      e?.preventDefault?.();
      handleSend();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        <Tooltip text="Chat parameters & system prompt" delay={1000} position="top" align="left">
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => setChatSettingsOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Chat parameters"
          >
            <Plus color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </Tooltip>

        <TextInput
          style={[styles.input, { color: colors.textPrimary, outlineStyle: 'none' as any }]}
          placeholder="Ask anything or explore ideas..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          onKeyPress={handleKeyDown}
        />

        {text.length > 0 && !isStreaming && (
          <Tooltip text="Clear input" delay={1000} position="top" align="right">
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setText('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear input"
            >
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          </Tooltip>
        )}

        {isStreaming ? (
          <Tooltip text="Stop generation" delay={1000} position="top" align="right">
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.danger }]}
              onPress={stopGeneration}
              accessibilityLabel="Stop generation"
            >
              <Square color="#fff" size={13} fill="#fff" />
            </TouchableOpacity>
          </Tooltip>
        ) : (
          <Tooltip text="Send message" delay={1000} position="top" align="right">
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                !text.trim() && [styles.sendButtonDisabled, { backgroundColor: colors.cardHover }],
              ]}
              onPress={handleSend}
              disabled={!text.trim()}
              accessibilityLabel="Send message"
            >
              <ArrowUp
                color={text.trim() ? '#fff' : colors.textMuted}
                size={18}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </Tooltip>
        )}
      </View>

      {/* Model Selector and Config Pill */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.modelPill, { borderColor: colors.borderLight }]}
          onPress={() => setModelSelectorOpen(true)}
          activeOpacity={0.7}
        >
          <Sparkles color={colors.primary} size={13} />
          <Text style={[styles.modelPillText, { color: colors.textSecondary }]} numberOfLines={1}>
            {activeModelId} • {currentProvider?.name || 'Local'}
          </Text>
          <ChevronRight color={colors.textMuted} size={13} />
        </TouchableOpacity>

        <Tooltip text="Chat settings" delay={1000} position="top" align="right">
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setChatSettingsOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Chat settings"
          >
            <Settings2 color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        </Tooltip>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    minHeight: 48,
    gap: spacing.xs,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    maxHeight: 130,
  },
  clearBtn: {
    padding: 6,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: 4,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    maxWidth: '85%',
  },
  modelPillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    flexShrink: 1,
  },
  settingsButton: {
    padding: 6,
  },
});
