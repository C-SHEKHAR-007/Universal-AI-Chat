import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Copy,
  Check,
  RotateCcw,
  Zap,
  Clock,
  FileCode,
  Edit3,
  X,
  Send,
  MoreVertical,
  Info,
  Activity,
  Cpu,
  AlertCircle,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Tooltip } from '../common/Tooltip';
import { ChatMessage } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingIndicator } from './LoadingIndicator';
import {
  TOOLTIP_CONFIG,
  FALLBACK_MODEL_NAME,
} from '../../constants';
import { formatClockTime, formatDurationSeconds, copyToClipboard } from '../../utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onDelete?: (id: string, mode?: 'single' | 'rewind' | 'pair') => void;
  onEditAndResend?: (messageId: string, newContent: string) => void;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming,
  onRegenerate,
  onDelete,
  onEditAndResend,
}) => {
  const { colors, isDark } = useTheme();
  const [copiedText, setCopiedText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [showOptions, setShowOptions] = useState(false);

  const moreBtnRef = useRef<View>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight?: number;
    isMobile?: boolean;
  }>({ top: 100, left: 16, width: 320, isMobile: false });

  const charCount = message.content.length;
  const wordCount = message.content.trim() ? message.content.trim().split(/\s+/).length : 0;

  // Auto-close popover on global web events or scroll
  useEffect(() => {
    if (!showOptions) return;
    const handleGlobalClick = () => {
      setShowOptions(false);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('resize', handleGlobalClick);
      return () => {
        window.removeEventListener('resize', handleGlobalClick);
      };
    }
  }, [showOptions]);

  const toggleOptions = () => {
    if (showOptions) {
      setShowOptions(false);
      return;
    }

    const calculateAndOpen = (x: number, y: number, width: number, height: number) => {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : Dimensions.get('window').width;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : Dimensions.get('window').height;
      const isMobile = screenWidth < 520;
      const cardWidth = isMobile ? Math.min(380, screenWidth - 32) : Math.min(340, screenWidth - 32);
      const estimatedHeight = 310;
      const maxHeight = Math.min(540, screenHeight * 0.82);

      // On mobile / small screens, center modal dialog for optimal readability and touch reach
      if (isMobile) {
        const popTop = Math.max(24, (screenHeight - Math.min(estimatedHeight, maxHeight)) / 2);
        const popLeft = Math.max(16, (screenWidth - cardWidth) / 2);
        setPopoverPosition({ top: popTop, left: popLeft, width: cardWidth, maxHeight, isMobile: true });
        setShowOptions(true);
        return;
      }

      // Top navigation header is ~56px, bottom input bar is ~80px
      const headerOffset = 58;
      const bottomBarOffset = 80;

      // If coordinates are missing or 0 (e.g. Android measurement glitch), center on screen
      if ((!x && !y) || (x <= 0 && y <= 0)) {
        const fallbackTop = Math.max(headerOffset + 16, (screenHeight - estimatedHeight) / 2 - 20);
        const fallbackLeft = Math.max(16, (screenWidth - cardWidth) / 2);
        setPopoverPosition({ top: fallbackTop, left: fallbackLeft, width: cardWidth, maxHeight, isMobile: false });
        setShowOptions(true);
        return;
      }

      const spaceAbove = y - headerOffset;
      const spaceBelow = screenHeight - (y + height) - bottomBarOffset;

      let popTop: number;
      // Prioritize placing below if space below is sufficient, or if space below > space above
      if (spaceBelow >= estimatedHeight) {
        popTop = y + height + 6;
      } else if (spaceAbove >= estimatedHeight) {
        popTop = y - estimatedHeight - 6;
      } else {
        if (spaceBelow >= spaceAbove) {
          popTop = Math.min(y + height + 6, screenHeight - estimatedHeight - 16);
        } else {
          popTop = Math.max(headerOffset + 8, y - estimatedHeight - 6);
        }
      }

      // Horizontal alignment: clamp within screen boundaries
      const popLeft = Math.max(16, Math.min(x, screenWidth - cardWidth - 16));

      setPopoverPosition({ top: popTop, left: popLeft, width: cardWidth, maxHeight, isMobile: false });
      setShowOptions(true);
    };

    // 1. Web DOM measurement
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const domNode = moreBtnRef.current as any;
      if (domNode?.getBoundingClientRect) {
        const rect = domNode.getBoundingClientRect();
        calculateAndOpen(rect.left, rect.top, rect.width, rect.height);
        return;
      }
    }

    // 2. React Native Native measurement (Android / iOS)
    if (moreBtnRef.current) {
      const target = moreBtnRef.current as any;
      if (typeof target.measureInWindow === 'function') {
        target.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (x > 0 || y > 0) {
            calculateAndOpen(x, y, width, height);
          } else if (typeof target.measure === 'function') {
            target.measure((_fx: number, _fy: number, w: number, h: number, px: number, py: number) => {
              calculateAndOpen(px, py, w, h);
            });
          } else {
            calculateAndOpen(x, y, width, height);
          }
        });
        return;
      } else if (typeof target.measure === 'function') {
        target.measure((_fx: number, _fy: number, w: number, h: number, px: number, py: number) => {
          calculateAndOpen(px, py, w, h);
        });
        return;
      }
    }

    // 3. Fallback centering
    calculateAndOpen(0, 0, 0, 0);
  };

  const isUser = message.role === 'user';

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleSaveEdit = () => {
    if (editDraft.trim() && onEditAndResend) {
      setIsEditing(false);
      onEditAndResend(message.id, editDraft.trim());
    }
  };



  // --- USER MESSAGE LAYOUT (ChatGPT style: collapsed, aligned to right) ---
  if (isUser) {
    return (
      <View style={styles.userOuterWrapper}>
        <View style={styles.userBubbleContainer}>
          {isEditing ? (
            <View style={[styles.editBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.editInput, { color: colors.textPrimary, outlineStyle: 'none' as any }]}
                value={editDraft}
                onChangeText={setEditDraft}
                multiline
                autoFocus
                underlineColorAndroid="transparent"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editBtn, { borderColor: colors.borderLight }]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditDraft(message.content);
                  }}
                >
                  <X size={14} color={colors.textSecondary} />
                  <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, styles.editBtnPrimary, { backgroundColor: colors.primary }]}
                  onPress={handleSaveEdit}
                >
                  <Send size={14} color="#fff" />
                  <Text style={[styles.editBtnText, { color: '#fff' }]}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.userBubble,
                {
                  backgroundColor: colors.userBubble,
                  borderColor: colors.userBubbleBorder,
                },
              ]}
            >
              <MarkdownRenderer content={message.content} isUser={true} />
            </View>
          )}

          {/* User message actions: Edit & Copy (No delete button in chat) */}
          {!isEditing && (
            <View style={styles.userActionArea}>
              {onEditAndResend && (
                <Tooltip text="Edit prompt" delay={1000} align="right">
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => setIsEditing(true)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel="Edit prompt"
                  >
                    <Edit3 size={13} color={colors.textMuted} />
                  </TouchableOpacity>
                </Tooltip>
              )}
              <Tooltip text={copiedText ? 'Copied!' : 'Copy'} delay={1000} align="right">
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => handleCopy(message.content)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel="Copy prompt"
                >
                  {copiedText ? (
                    <Check size={13} color={colors.success} />
                  ) : (
                    <Copy size={13} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </Tooltip>
            </View>
          )}
        </View>
      </View>
    );
  }

  // --- ASSISTANT MESSAGE LAYOUT (ChatGPT style: open layout, aligned to left) ---
  return (
    <View style={styles.assistantOuterWrapper}>
      <View style={styles.assistantRow}>
        {/* AI Message Content */}
        <View style={styles.aiContentPane}>
          <View style={styles.aiBody}>
            {message.error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted, borderColor: colors.danger }]}>
                <View style={styles.errorHeaderRow}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={[styles.errorTitle, { color: colors.danger }]}>Provider Connection Error</Text>
                </View>
                <Text style={[styles.errorBodyText, { color: colors.textPrimary }]}>
                  {message.content}
                </Text>
              </View>
            ) : isStreaming && !message.content ? (
              <LoadingIndicator
                conversationId={message.conversationId}
                modelName={message.telemetry?.modelId}
              />
            ) : (
              <MarkdownRenderer
                content={message.content}
                isUser={false}
                isStreaming={isStreaming}
              />
            )}
          </View>

          {/* AI Response Footer: Copy, Retry, Vertical More (Aligned to left at end of response) */}
          {!isStreaming && (
            <View style={styles.aiFooterRow}>
              {/* Copy Icon */}
              <Tooltip text={copiedText ? 'Copied!' : 'Copy'} delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => handleCopy(message.content)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Copy response"
                >
                  {copiedText ? (
                    <Check color={colors.success} size={15} />
                  ) : (
                    <Copy color={colors.textMuted} size={15} />
                  )}
                </TouchableOpacity>
              </Tooltip>

              {/* Retry / Regenerate Icon */}
              {onRegenerate && (
                <Tooltip text="Regenerate response" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={onRegenerate}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Regenerate response"
                  >
                    <RotateCcw color={colors.textMuted} size={15} />
                  </TouchableOpacity>
                </Tooltip>
              )}

              {/* Vertical More Button with Popover */}
              <Tooltip text="More options" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
                <View ref={moreBtnRef} collapsable={false}>
                  <TouchableOpacity
                    style={[
                      styles.iconActionBtn,
                      showOptions && { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={toggleOptions}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="More options"
                  >
                    <MoreVertical
                      color={showOptions ? colors.primary : colors.textMuted}
                      size={15}
                    />
                  </TouchableOpacity>
                </View>
              </Tooltip>

              {/* Responsive & Collision-Aware Floating Modal Popover */}
              {showOptions && (
                <Modal
                  transparent
                  visible={showOptions}
                  onRequestClose={() => setShowOptions(false)}
                  animationType={popoverPosition.isMobile ? 'fade' : 'none'}
                >
                  <View style={styles.modalRoot}>
                    {/* Transparent/Dim Dismiss Backdrop */}
                    <TouchableOpacity
                      style={[
                        StyleSheet.absoluteFill,
                        popoverPosition.isMobile && {
                          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)',
                        },
                      ]}
                      activeOpacity={1}
                      onPress={() => setShowOptions(false)}
                    />

                    {/* Popover Card dynamically positioned */}
                    <View
                      style={[
                        styles.popoverCardFloating,
                        {
                          top: popoverPosition.top,
                          left: popoverPosition.left,
                          width: popoverPosition.width,
                          maxHeight: popoverPosition.maxHeight,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          shadowColor: colors.textPrimary,
                        },
                      ]}
                    >
                      {/* Popover Header */}
                      <View style={[styles.popoverHeaderRow, { borderBottomColor: colors.borderLight }]}>
                        <View style={styles.popoverHeaderLeft}>
                          <Info size={14} color={colors.primary} />
                          <Text style={[styles.popoverHeaderTitle, { color: colors.textPrimary }]}>
                            Response Details
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.popoverCloseBtn, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => setShowOptions(false)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="Close response details"
                        >
                          <X size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {/* Scrollable Body */}
                      <ScrollView
                        style={styles.popoverScrollView}
                        contentContainerStyle={styles.popoverScrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                      >
                        {/* Model & Provider Card */}
                        <View
                          style={[
                            styles.popoverModelBox,
                            {
                              backgroundColor: colors.backgroundSecondary,
                              borderColor: colors.borderLight,
                            },
                          ]}
                        >
                          <View style={[styles.popoverModelIconWrap, { backgroundColor: colors.primaryMuted }]}>
                            <Cpu size={16} color={colors.primary} />
                          </View>
                          <View style={styles.popoverModelTextCol}>
                            <Text
                              style={[styles.popoverModelName, { color: colors.textPrimary }]}
                              numberOfLines={2}
                            >
                              {message.telemetry?.modelId || FALLBACK_MODEL_NAME}
                            </Text>
                            {message.telemetry?.providerName ? (
                              <Text
                                style={[styles.popoverProviderName, { color: colors.textMuted }]}
                                numberOfLines={1}
                              >
                                {message.telemetry.providerName}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Telemetry Stats */}
                        <View style={[styles.popoverStatsSection, { borderColor: colors.borderLight }]}>
                          {message.telemetry?.tokensPerSec ? (
                            <View style={styles.popoverStatRow}>
                              <View style={styles.popoverStatLabelGroup}>
                                <Zap size={13} color={colors.success} />
                                <Text style={[styles.popoverStatLabel, { color: colors.textSecondary }]}>
                                  Speed
                                </Text>
                              </View>
                              <Text style={[styles.popoverStatValue, { color: colors.textPrimary }]}>
                                {message.telemetry.tokensPerSec} tok/s
                              </Text>
                            </View>
                          ) : null}

                          {message.telemetry?.tokensOut ? (
                            <View style={styles.popoverStatRow}>
                              <View style={styles.popoverStatLabelGroup}>
                                <Activity size={13} color={colors.primary} />
                                <Text style={[styles.popoverStatLabel, { color: colors.textSecondary }]}>
                                  Generated
                                </Text>
                              </View>
                              <Text style={[styles.popoverStatValue, { color: colors.textPrimary }]}>
                                {message.telemetry.tokensOut} tokens
                              </Text>
                            </View>
                          ) : null}

                          {message.telemetry?.ttftMs ? (
                            <View style={styles.popoverStatRow}>
                              <View style={styles.popoverStatLabelGroup}>
                                <Clock size={13} color={colors.textMuted} />
                                <Text style={[styles.popoverStatLabel, { color: colors.textSecondary }]}>
                                  TTFT
                                </Text>
                              </View>
                              <Text style={[styles.popoverStatValue, { color: colors.textPrimary }]}>
                                {formatDurationSeconds(message.telemetry.ttftMs)}
                              </Text>
                            </View>
                          ) : null}

                          <View style={styles.popoverStatRow}>
                            <View style={styles.popoverStatLabelGroup}>
                              <Info size={13} color={colors.textMuted} />
                              <Text style={[styles.popoverStatLabel, { color: colors.textSecondary }]}>
                                Length
                              </Text>
                            </View>
                            <Text style={[styles.popoverStatValue, { color: colors.textPrimary }]}>
                              {wordCount} words ({charCount} chars)
                            </Text>
                          </View>

                          {message.createdAt ? (
                            <View style={styles.popoverStatRow}>
                              <View style={styles.popoverStatLabelGroup}>
                                <Clock size={13} color={colors.textMuted} />
                                <Text style={[styles.popoverStatLabel, { color: colors.textSecondary }]}>
                                  Time
                                </Text>
                              </View>
                              <Text style={[styles.popoverStatValue, { color: colors.textMuted }]}>
                                {formatClockTime(message.createdAt)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Options / Actions */}
                        <View style={styles.popoverActionsSection}>
                          <TouchableOpacity
                            style={[styles.popoverActionBtn, { backgroundColor: colors.backgroundSecondary }]}
                            onPress={() => {
                              handleCopy(message.content);
                              setShowOptions(false);
                            }}
                          >
                            <Copy size={13} color={colors.primary} />
                            <Text style={[styles.popoverActionBtnText, { color: colors.textPrimary }]}>
                              Copy full response
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  // User Right Collapsed Bubble
  userOuterWrapper: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubbleContainer: {
    maxWidth: '78%',
    alignItems: 'flex-end',
  },
  userBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 22,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  userText: {
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  userActionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
    paddingRight: 4,
  },
  userMoreBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userOptionsMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  microActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 3,
  },
  microActionText: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  editBox: {
    width: '100%',
    minWidth: 260,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  editInput: {
    fontSize: typography.size.md,
    lineHeight: 22,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 0,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  editBtnPrimary: {
    borderWidth: 0,
  },
  editBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // Assistant Left Open Layout
  assistantOuterWrapper: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  assistantRow: {
    maxWidth: 820,
    width: '100%',
  },
  aiContentPane: {
    width: '100%',
  },
  aiBody: {
    width: '100%',
    marginTop: 2,
  },
  textBlock: {
    marginBottom: 4,
  },
  assistantText: {
    fontSize: typography.size.md,
    lineHeight: 24,
  },
  headerText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginVertical: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingTop: 4,
  },
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  popoverCardFloating: {
    position: 'absolute',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    zIndex: 99999,
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  popoverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  popoverHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popoverHeaderTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.2,
  },
  popoverCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverScrollView: {
    flexGrow: 0,
  },
  popoverScrollContent: {
    paddingBottom: 2,
  },
  popoverModelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  popoverModelIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  popoverModelTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  popoverModelName: {
    fontSize: typography.size.xs + 1,
    fontWeight: typography.weight.bold,
    lineHeight: 18,
  },
  popoverProviderName: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  popoverStatsSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginVertical: 4,
    gap: 8,
  },
  popoverStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popoverStatLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popoverStatLabel: {
    fontSize: 12,
    fontWeight: typography.weight.medium,
  },
  popoverStatValue: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  popoverActionsSection: {
    marginTop: 10,
  },
  popoverActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  popoverActionBtnText: {
    fontSize: typography.size.xs + 1,
    fontWeight: typography.weight.semibold,
  },

  // Code Block
  codeContainer: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  codeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLanguage: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textTransform: 'lowercase',
  },
  codeCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  codeCopyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  codeBody: {
    padding: spacing.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 6,
    gap: 8,
  },
  errorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  errorBodyText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
});

export const MessageBubble = React.memo(MessageBubbleComponent);

