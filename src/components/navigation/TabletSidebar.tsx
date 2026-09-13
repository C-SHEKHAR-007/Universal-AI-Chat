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
  Brain,
  Plus,
  Search,
  MessageSquare,
  Cpu,
  Activity,
  Settings,
  Trash2,
  Sun,
  Moon,
  Pencil,
  Check,
  X,
  Pin,
  Archive,
  MoreVertical,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Tooltip } from '../common/Tooltip';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { APP_NAME, TOOLTIP_CONFIG } from '../../constants';

export const TabletSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
    activeTab,
    setActiveTab,
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    archiveConversation,
    togglePinConversation,
  } = useAppStore();
  const { loadMessages, clearActiveChat } = useChatStore();

  const handleNewChat = async () => {
    clearActiveChat();
    const newConv = await createConversation('New Chat');
    await setActiveConversationId(newConv.id);
    setActiveTab('chat');
  };

  const handleSelectConversation = async (id: string) => {
    await setActiveConversationId(id);
    await loadMessages(id);
    setActiveTab('chat');
  };

  const activeConversations = conversations.filter((c) => !c.isArchived);
  const filteredConversations = activeConversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedConversations = filteredConversations.filter((c) => !!c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  const renderChatRow = (conv: any) => {
    const isSelected = activeConversationId === conv.id && activeTab === 'chat';
    const isItemEditing = editingId === conv.id;

    const handleSaveSidebarEdit = async () => {
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
      >
        {isItemEditing ? (
          <View style={styles.sidebarEditRow}>
            <TextInput
              style={[
                styles.sidebarInlineInput,
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
              onSubmitEditing={handleSaveSidebarEdit}
              returnKeyType="done"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              onPress={handleSaveSidebarEdit}
              style={[styles.sidebarActionBtn, { backgroundColor: colors.primary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Check color="#fff" size={13} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditingId(null)}
              style={[styles.sidebarActionBtn, { backgroundColor: colors.cardHover }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X color={colors.textSecondary} size={13} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {conv.isPinned ? (
              <Pin color={colors.warning} size={15} />
            ) : (
              <MessageSquare
                color={isSelected ? colors.primary : colors.textMuted}
                size={15}
              />
            )}
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
            <View style={styles.chatActionBtns}>
              <Tooltip text="More options" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
                <TouchableOpacity
                  onPress={(e) => {
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
                  <MoreVertical color={colors.textMuted} size={14} />
                </TouchableOpacity>
              </Tooltip>

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
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        togglePinConversation(conv.id);
                        setActiveMenuConvId(null);
                      }}
                    >
                      <Pin color={conv.isPinned ? colors.warning : colors.textSecondary} size={13} />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: conv.isPinned ? colors.warning : colors.textPrimary },
                        ]}
                      >
                        {conv.isPinned ? 'Unpin' : 'Pin'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setActiveMenuConvId(null);
                        setEditingId(conv.id);
                        setEditingTitle(conv.title);
                      }}
                    >
                      <Pencil color={colors.textSecondary} size={13} />
                      <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        Rename
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        archiveConversation(conv.id);
                        setActiveMenuConvId(null);
                      }}
                    >
                      <Archive color={colors.textSecondary} size={13} />
                      <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                        Archive
                      </Text>
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        deleteConversation(conv.id);
                        setActiveMenuConvId(null);
                      }}
                    >
                      <Trash2 color={colors.danger} size={13} />
                      <Text style={[styles.menuItemText, { color: colors.danger }]}>
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <View style={styles.brandRow}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
            <Brain color={colors.primary} size={22} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{APP_NAME}</Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.themeToggleBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Toggle theme"
        >
          {isDark ? <Sun color={colors.warning} size={18} /> : <Moon color={colors.primary} size={18} />}
        </TouchableOpacity>
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

      {/* Main Nav Items */}
      <View style={styles.navSection}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'conversations' && { backgroundColor: colors.primaryMuted }]}
          onPress={() => setActiveTab('conversations')}
        >
          <MessageSquare
            color={activeTab === 'conversations' ? colors.primary : colors.textSecondary}
            size={18}
          />
          <Text
            style={[
              styles.navItemText,
              { color: activeTab === 'conversations' ? colors.primary : colors.textSecondary },
              activeTab === 'conversations' && styles.navItemTextActive,
            ]}
          >
            Conversations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'models' && { backgroundColor: colors.primaryMuted }]}
          onPress={() => setActiveTab('models')}
        >
          <Cpu
            color={activeTab === 'models' ? colors.primary : colors.textSecondary}
            size={18}
          />
          <Text
            style={[
              styles.navItemText,
              { color: activeTab === 'models' ? colors.primary : colors.textSecondary },
              activeTab === 'models' && styles.navItemTextActive,
            ]}
          >
            Models & Providers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'performance' && { backgroundColor: colors.primaryMuted }]}
          onPress={() => setActiveTab('performance')}
        >
          <Activity
            color={activeTab === 'performance' ? colors.primary : colors.textSecondary}
            size={18}
          />
          <Text
            style={[
              styles.navItemText,
              { color: activeTab === 'performance' ? colors.primary : colors.textSecondary },
              activeTab === 'performance' && styles.navItemTextActive,
            ]}
          >
            Performance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Conversations */}
      <View
        style={[
          styles.searchWrapper,
          {
            backgroundColor: colors.card,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Search color={colors.textMuted} size={15} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Recent Chats List */}
      <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
        {pinnedConversations.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.warning }]}>PINNED</Text>
            {pinnedConversations.map(renderChatRow)}
          </>
        )}
        <Text style={[styles.sectionHeader, { color: colors.textMuted, marginTop: pinnedConversations.length > 0 ? spacing.sm : 0 }]}>
          RECENT CHATS
        </Text>
        {unpinnedConversations.map(renderChatRow)}
      </ScrollView>

      {/* Settings Footer */}
      <TouchableOpacity
        style={[
          styles.settingsFooter,
          { borderTopColor: colors.borderLight },
          activeTab === 'settings' && { backgroundColor: colors.primaryMuted },
        ]}
        onPress={() => setActiveTab('settings')}
      >
        <Settings
          color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          size={18}
        />
        <Text
          style={[
            styles.settingsText,
            { color: activeTab === 'settings' ? colors.primary : colors.textSecondary },
            activeTab === 'settings' && styles.settingsTextActive,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    borderRightWidth: 1,
    padding: spacing.md,
    height: '100%',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  themeToggleBtn: {
    padding: 6,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius.md,
    paddingVertical: 9,
    marginBottom: spacing.md,
  },
  newChatBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
  navSection: {
    marginBottom: spacing.md,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  navItemText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  navItemTextActive: {
    fontWeight: typography.weight.semibold,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    height: 36,
    gap: 6,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.xs,
    height: '100%',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  chatsList: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: 2,
    gap: spacing.sm,
  },
  chatRowSelected: {
    borderLeftWidth: 3,
  },
  chatTitle: {
    flex: 1,
    fontSize: typography.size.xs,
  },
  chatTitleSelected: {
    fontWeight: typography.weight.medium,
  },
  chatActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  deleteBtn: {
    padding: 3,
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
    top: 24,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 130,
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
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  menuItemText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  sidebarEditRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sidebarInlineInput: {
    flex: 1,
    height: 26,
    borderRadius: borderRadius.sm,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 6,
    fontSize: typography.size.xs,
    outlineStyle: 'none' as any,
    boxShadow: 'none' as any,
  },
  sidebarActionBtn: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
  },
  settingsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  settingsTextActive: {
    fontWeight: typography.weight.semibold,
  },
});
