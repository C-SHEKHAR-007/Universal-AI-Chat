import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import {
  Brain,
  MessageSquare,
  Library,
  Cpu,
  Activity,
  Settings,
  Plus,
  X,
  Sun,
  Moon,
  Trash2,
  Pencil,
  Check,
  Pin,
  Archive,
  MoreVertical,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Tooltip } from '../common/Tooltip';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { APP_NAME, APP_VERSION, TOOLTIP_CONFIG } from '../../constants';

export const MobileDrawer: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenuConvId) return;
    const handleGlobalClick = () => {
      setActiveMenuConvId(null);
    };
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('touchstart', handleGlobalClick);
      }, 0);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleGlobalClick);
        window.removeEventListener('touchstart', handleGlobalClick);
      };
    }
  }, [activeMenuConvId]);

  const { colors, isDark, toggleTheme } = useTheme();
  const {
    isDrawerOpen,
    setDrawerOpen,
    activeTab,
    setActiveTab,
    createConversation,
    conversations,
    activeConversationId,
    setActiveConversationId,
    deleteConversation,
    updateConversationTitle,
    archiveConversation,
    togglePinConversation,
    activeModelId,
    activeProviderId,
    providers,
  } = useAppStore();
  const { clearActiveChat } = useChatStore();

  if (!isDrawerOpen) return null;

  const currentProvider = providers.find((p) => p.id === activeProviderId);

  const handleNav = (tab: any) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const handleNewChat = async () => {
    clearActiveChat();
    await createConversation('New Chat');
    setActiveTab('chat');
    setDrawerOpen(false);
  };

  const handleSelectConversation = async (id: string) => {
    await setActiveConversationId(id);
    setActiveTab('chat');
    setDrawerOpen(false);
  };

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.drawerContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderRightColor: colors.border,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.brandRow}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
              <Brain color={colors.primary} size={22} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{APP_NAME}</Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Toggle theme"
            >
              {isDark ? <Sun color={colors.warning} size={18} /> : <Moon color={colors.primary} size={18} />}
            </TouchableOpacity>
            <Tooltip text="Close menu" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
              <TouchableOpacity
                onPress={() => setDrawerOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close menu"
              >
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </Tooltip>
          </View>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity
          style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
          onPress={handleNewChat}
          activeOpacity={0.8}
        >
          <Plus color="#fff" size={18} />
          <Text style={styles.newChatBtnText}>New Chat</Text>
        </TouchableOpacity>

        {/* Navigation List & Recent Chats */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('conversations')}>
            <Library color={colors.textSecondary} size={20} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>All Conversations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('models')}>
            <Cpu color={colors.textSecondary} size={20} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Models & Providers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('performance')}>
            <Activity color={colors.textSecondary} size={20} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Performance & Speed</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('settings')}>
            <Settings color={colors.textSecondary} size={20} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Settings</Text>
          </TouchableOpacity>

          {/* Recent Chats Section */}
          {conversations.filter((c) => !c.isArchived).length > 0 && (() => {
            const activeConversations = conversations.filter((c) => !c.isArchived);
            const pinnedConversations = activeConversations.filter((c) => !!c.isPinned);
            const unpinnedConversations = activeConversations.filter((c) => !c.isPinned);

            const renderDrawerRow = (conv: any) => {
              const isSelected = activeConversationId === conv.id && activeTab === 'chat';
              const isItemEditing = editingId === conv.id;

              const handleSaveDrawerEdit = async () => {
                const trimmed = editingTitle.trim();
                if (trimmed) {
                  await updateConversationTitle(conv.id, trimmed, true);
                }
                setEditingId(null);
              };

              return (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.chatRow,
                    { zIndex: activeMenuConvId === conv.id ? 100 : 1 },
                    isSelected && [
                      styles.chatRowSelected,
                      {
                        backgroundColor: colors.cardHover,
                        borderLeftColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => {
                    if (!isItemEditing) {
                      handleSelectConversation(conv.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {conv.isPinned ? (
                    <Pin color={colors.warning} size={15} />
                  ) : (
                    <MessageSquare
                      color={isSelected ? colors.primary : colors.textMuted}
                      size={15}
                    />
                  )}
                  {isItemEditing ? (
                    <View style={styles.drawerEditRow}>
                      <TextInput
                        style={[
                          styles.drawerInlineInput,
                          {
                            color: colors.textPrimary,
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.primary,
                          },
                        ]}
                        value={editingTitle}
                        onChangeText={setEditingTitle}
                        autoFocus
                        onSubmitEditing={handleSaveDrawerEdit}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        onPress={handleSaveDrawerEdit}
                        style={[styles.drawerActionBtn, { backgroundColor: colors.primary }]}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Check color="#fff" size={12} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingId(null)}
                        style={[styles.drawerActionBtn, { backgroundColor: colors.backgroundSecondary }]}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X color={colors.textSecondary} size={12} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.chatTitle,
                          { color: isSelected ? colors.textPrimary : colors.textSecondary },
                          isSelected && styles.chatTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.title}
                      </Text>
                      <View style={styles.drawerActionBtns}>
                        <Tooltip text="More options" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
                          <TouchableOpacity
                            onPress={(e: any) => {
                              e?.stopPropagation?.();
                              setActiveMenuConvId(activeMenuConvId === conv.id ? null : conv.id);
                            }}
                            style={[
                              styles.deleteBtn,
                              activeMenuConvId === conv.id && { backgroundColor: colors.backgroundTertiary },
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="More options"
                          >
                            <MoreVertical color={colors.textMuted} size={15} />
                          </TouchableOpacity>
                        </Tooltip>

                        {activeMenuConvId === conv.id && (
                          <>
                            <TouchableOpacity
                              style={styles.menuBackdrop}
                              activeOpacity={1}
                              onPress={(e: any) => {
                                e?.stopPropagation?.();
                                setActiveMenuConvId(null);
                              }}
                            />
                            <View
                              style={[
                                styles.dropdownMenu,
                                {
                                  backgroundColor: colors.card,
                                  borderColor: colors.border,
                                },
                              ]}
                            >
                              <TouchableOpacity
                                style={styles.dropdownMenuItem}
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  togglePinConversation(conv.id);
                                  setActiveMenuConvId(null);
                                }}
                              >
                                <Pin color={conv.isPinned ? colors.warning : colors.textSecondary} size={13} />
                                <Text
                                  style={[
                                    styles.dropdownMenuItemText,
                                    { color: conv.isPinned ? colors.warning : colors.textPrimary },
                                  ]}
                                >
                                  {conv.isPinned ? 'Unpin' : 'Pin to top'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.dropdownMenuItem}
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  setActiveMenuConvId(null);
                                  setEditingId(conv.id);
                                  setEditingTitle(conv.title);
                                }}
                              >
                                <Pencil color={colors.textSecondary} size={13} />
                                <Text style={[styles.dropdownMenuItemText, { color: colors.textPrimary }]}>
                                  Rename
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.dropdownMenuItem}
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  archiveConversation(conv.id);
                                  setActiveMenuConvId(null);
                                }}
                              >
                                <Archive color={colors.textSecondary} size={13} />
                                <Text style={[styles.dropdownMenuItemText, { color: colors.textPrimary }]}>
                                  Archive
                                </Text>
                              </TouchableOpacity>

                              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                              <TouchableOpacity
                                style={styles.dropdownMenuItem}
                                onPress={(e: any) => {
                                  e?.stopPropagation?.();
                                  deleteConversation(conv.id);
                                  setActiveMenuConvId(null);
                                }}
                              >
                                <Trash2 color={colors.danger} size={13} />
                                <Text style={[styles.dropdownMenuItemText, { color: colors.danger }]}>
                                  Delete
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            };

            return (
              <View style={styles.recentSection}>
                {pinnedConversations.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeader, { color: colors.warning }]}>PINNED</Text>
                    {pinnedConversations.slice(0, 4).map(renderDrawerRow)}
                  </>
                )}
                <Text style={[styles.sectionHeader, { color: colors.textMuted, marginTop: pinnedConversations.length > 0 ? spacing.sm : 0 }]}>
                  RECENT CHATS
                </Text>
                {unpinnedConversations.slice(0, 8).map(renderDrawerRow)}
              </View>
            );
          })()}
        </ScrollView>

        {/* Footer info card */}
        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <View
            style={[
              styles.modelStatusCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modelStatusHeader}>
              <Text style={[styles.modelStatusLabel, { color: colors.textMuted }]}>Current Model</Text>
              <View style={styles.statusDotRow}>
                <View style={[styles.greenDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.success }]}>Connected</Text>
              </View>
            </View>
            <Text style={[styles.modelStatusValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeModelId} • {currentProvider?.name || 'Local'}
            </Text>
          </View>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            {APP_NAME} v{APP_VERSION}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  drawerContainer: {
    width: 290,
    height: '100%',
    padding: spacing.lg,
    borderRightWidth: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  newChatBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  menuItemText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  modelStatusCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  modelStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modelStatusLabel: {
    fontSize: typography.size.xs,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
  },
  modelStatusValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  recentSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  chatRowSelected: {
    borderLeftWidth: 3,
  },
  chatTitle: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  chatTitleSelected: {
    fontWeight: typography.weight.semibold,
  },
  drawerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  deleteBtn: {
    padding: 4,
    borderRadius: borderRadius.sm,
  },
  menuBackdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 26,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 135,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  dropdownMenuItemText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  drawerEditRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drawerInlineInput: {
    flex: 1,
    height: 30,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: typography.size.sm,
  },
  drawerActionBtn: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
