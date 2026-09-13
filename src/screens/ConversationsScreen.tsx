import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import {
  MessageSquare,
  Search,
  Trash2,
  Plus,
  Clock,
  Pencil,
  Check,
  X,
  Pin,
  Archive,
  ArchiveRestore,
  MoreVertical,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Header } from '../components/common/Header';
import { Tooltip } from '../components/common/Tooltip';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { Conversation } from '../types';
import { DEFAULT_CHAT_TITLE, TOOLTIP_CONFIG } from '../constants';
import { formatClockTime } from '../utils';

export const ConversationsScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'archived'>('active');
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

  const { colors } = useTheme();
  const {
    conversations,
    setActiveConversationId,
    setActiveTab,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    archiveConversation,
    unarchiveConversation,
    togglePinConversation,
  } = useAppStore();
  const { loadMessages, clearActiveChat } = useChatStore();

  const handleSelectConv = async (conv: Conversation) => {
    if (editingId) return;
    await setActiveConversationId(conv.id);
    await loadMessages(conv.id);
    setActiveTab('chat');
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      await updateConversationTitle(id, trimmed, true);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleNewChat = async () => {
    clearActiveChat();
    const newConv = await createConversation(DEFAULT_CHAT_TITLE);
    await setActiveConversationId(newConv.id);
    setActiveTab('chat');
  };

  // Separate active vs archived
  const activeCount = conversations.filter((c) => !c.isArchived).length;
  const archivedCount = conversations.filter((c) => !!c.isArchived).length;

  const currentList = conversations.filter((c) =>
    activeFilter === 'archived' ? !!c.isArchived : !c.isArchived
  );

  const filtered = currentList.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessageSnippet && c.lastMessageSnippet.toLowerCase().includes(search.toLowerCase()))
  );

  const pinnedConvs = filtered.filter((c) => !!c.isPinned);
  const unpinnedConvs = filtered.filter((c) => !c.isPinned);

  const now = Date.now();
  const oneDay = 86400000;
  const todayConvs = unpinnedConvs.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayConvs = unpinnedConvs.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < oneDay * 2
  );
  const olderConvs = unpinnedConvs.filter((c) => now - c.updatedAt >= oneDay * 2);

  const renderSection = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{title}</Text>
        {items.map((conv) => {
          const isItemEditing = editingId === conv.id;
          return (
            <TouchableOpacity
              key={conv.id}
              style={[
                styles.convCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isItemEditing ? colors.primary : colors.border,
                  zIndex: activeMenuConvId === conv.id ? 100 : 1,
                },
              ]}
              onPress={() => handleSelectConv(conv)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: conv.isPinned ? colors.warningLight : colors.primaryMuted }]}>
                {conv.isPinned ? (
                  <Pin color={colors.warning} size={18} />
                ) : (
                  <MessageSquare color={colors.primary} size={18} />
                )}
              </View>

              <View style={styles.convInfo}>
                {isItemEditing ? (
                  <View style={styles.editInputRow}>
                    <TextInput
                      style={[
                        styles.inlineTitleInput,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.backgroundSecondary,
                          borderWidth: 0,
                          borderColor: 'transparent',
                        },
                      ]}
                      value={editingTitle}
                      onChangeText={setEditingTitle}
                      autoFocus
                      onSubmitEditing={() => handleSaveEdit(conv.id)}
                      returnKeyType="done"
                      underlineColorAndroid="transparent"
                    />
                    <TouchableOpacity
                      onPress={() => handleSaveEdit(conv.id)}
                      style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Check color="#fff" size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary }]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.convTitleRow}>
                      <Text style={[styles.convTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {conv.title}
                      </Text>
                      <Text style={[styles.convTime, { color: colors.textMuted }]}>
                        {formatClockTime(conv.updatedAt)}
                      </Text>
                    </View>
                    <Text style={[styles.convSnippet, { color: colors.textSecondary }]} numberOfLines={1}>
                      {conv.lastMessageSnippet || 'No messages yet'}
                    </Text>
                  </>
                )}
              </View>

              {!isItemEditing && (
                <View style={styles.cardActionsRow}>
                  <Tooltip text="More options" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setActiveMenuConvId(activeMenuConvId === conv.id ? null : conv.id);
                      }}
                      style={[
                        styles.cardActionBtn,
                        activeMenuConvId === conv.id && { backgroundColor: colors.backgroundSecondary },
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="More options"
                    >
                      <MoreVertical color={colors.textMuted} size={18} />
                    </TouchableOpacity>
                  </Tooltip>

                  {/* Single dropdown menu for chat options */}
                  {activeMenuConvId === conv.id && (
                    <>
                      <TouchableOpacity
                        style={styles.menuBackdrop}
                        activeOpacity={1}
                        onPress={(e) => {
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
                      {activeFilter === 'active' && (
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            togglePinConversation(conv.id);
                            setActiveMenuConvId(null);
                          }}
                        >
                          <Pin color={conv.isPinned ? colors.warning : colors.textSecondary} size={14} />
                          <Text
                            style={[
                              styles.menuItemText,
                              { color: conv.isPinned ? colors.warning : colors.textPrimary },
                            ]}
                          >
                            {conv.isPinned ? 'Unpin chat' : 'Pin to top'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setActiveMenuConvId(null);
                          handleStartEdit(conv);
                        }}
                      >
                        <Pencil color={colors.textSecondary} size={14} />
                        <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                          Rename
                        </Text>
                      </TouchableOpacity>

                      {conv.isArchived ? (
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            unarchiveConversation(conv.id);
                            setActiveMenuConvId(null);
                          }}
                        >
                          <ArchiveRestore color={colors.primary} size={14} />
                          <Text style={[styles.menuItemText, { color: colors.primary }]}>
                            Unarchive
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            archiveConversation(conv.id);
                            setActiveMenuConvId(null);
                          }}
                        >
                          <Archive color={colors.textSecondary} size={14} />
                          <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                            Archive
                          </Text>
                        </TouchableOpacity>
                      )}

                      <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setActiveMenuConvId(null);
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 color={colors.danger} size={14} />
                        <Text style={[styles.menuItemText, { color: colors.danger }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Conversations"
        showNewChat
        onNewChat={handleNewChat}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Search color={colors.textMuted} size={16} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Tooltip text="Clear search" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
              >
                <X color={colors.textMuted} size={15} />
              </TouchableOpacity>
            </Tooltip>
          )}
        </View>

        {/* Filter Segment Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'active' && [
                styles.filterTabActive,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveFilter('active')}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: activeFilter === 'active' ? colors.primary : colors.textSecondary },
                activeFilter === 'active' && styles.filterTabTextActive,
              ]}
            >
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'archived' && [
                styles.filterTabActive,
                { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveFilter('archived')}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: activeFilter === 'archived' ? colors.primary : colors.textSecondary },
                activeFilter === 'archived' && styles.filterTabTextActive,
              ]}
            >
              Archived ({archivedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              {activeFilter === 'archived' ? (
                <>
                  <Archive color={colors.textMuted} size={40} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No archived chats</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Archived conversations will appear here</Text>
                </>
              ) : (
                <>
                  <Clock color={colors.textMuted} size={40} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No conversations found</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Start a new conversation to get started</Text>
                  <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: colors.primary }]}
                    onPress={handleNewChat}
                  >
                    <Plus color="#fff" size={16} />
                    <Text style={styles.startBtnText}>Start New Chat</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <>
              {activeFilter === 'active' && pinnedConvs.length > 0 && (
                renderSection('PINNED', pinnedConvs)
              )}
              {renderSection('TODAY', todayConvs)}
              {renderSection('YESTERDAY', yesterdayConvs)}
              {renderSection('EARLIER', olderConvs)}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  filterTabTextActive: {
    fontWeight: typography.weight.bold,
  },
  scrollArea: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convInfo: {
    flex: 1,
  },
  convTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  convTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  convTime: {
    fontSize: 10,
  },
  convSnippet: {
    fontSize: typography.size.xs,
  },
  deleteBtn: {
    padding: 6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  cardActionBtn: {
    padding: 6,
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
    top: 32,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 145,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  menuItemText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  inlineTitleInput: {
    flex: 1,
    height: 34,
    borderRadius: borderRadius.sm,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 8,
    fontSize: typography.size.sm,
    outlineStyle: 'none' as any,
    boxShadow: 'none' as any,
  },
  smallActionBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: typography.size.xs,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  startBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
});
