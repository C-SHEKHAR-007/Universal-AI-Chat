import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import {
  Menu,
  MoreVertical,
  ArrowLeft,
  Plus,
  Sun,
  Moon,
  Pencil,
  Check,
  X,
  Pin,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { useResponsive } from '../../hooks/useResponsive';
import { APP_NAME, TOOLTIP_CONFIG, DEFAULT_CHAT_TITLE } from '../../constants';
import { storage } from '../../storage/storageAdapter';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNewChat?: boolean;
  onNewChat?: () => void;
  onOptionsPress?: () => void;
  editableTitle?: boolean;
  onTitleSave?: (newTitle: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = APP_NAME,
  subtitle,
  showBack,
  onBack,
  showNewChat,
  onNewChat,
  editableTitle = false,
  onTitleSave,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    toggleDrawer,
    activeModelId,
    activeProviderId,
    providers,
    activeConversationId,
    activeConversation,
    togglePinConversation,
    archiveConversation,
    deleteConversation,
    createConversation,
    setActiveConversationId,
  } = useAppStore();
  const { isMasterDetailSupported } = useResponsive();
  const { clearActiveChat } = useChatStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  // Global click outside listener to auto-close popover menu
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleGlobalClick = () => {
      setIsMenuOpen(false);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
  }, [isMenuOpen]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title && onTitleSave) {
      onTitleSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleRenameClick = () => {
    setIsMenuOpen(false);
    setIsEditing(true);
  };

  const handleTogglePin = async () => {
    setIsMenuOpen(false);
    if (activeConversationId) {
      await togglePinConversation(activeConversationId);
    }
  };

  const handleArchive = async () => {
    setIsMenuOpen(false);
    if (activeConversationId) {
      await archiveConversation(activeConversationId);
    }
  };

  const handleClearChatMessages = async () => {
    setIsMenuOpen(false);
    if (activeConversationId) {
      clearActiveChat();
      await storage.saveMessages(activeConversationId, []);
    }
  };

  const handleDeleteChat = async () => {
    setIsMenuOpen(false);
    if (activeConversationId) {
      await deleteConversation(activeConversationId);
      const newConv = await createConversation(DEFAULT_CHAT_TITLE);
      await setActiveConversationId(newConv.id);
    }
  };

  const currentProvider = providers.find((p) => p.id === activeProviderId);
  const displaySubtitle = subtitle || `${activeModelId} • ${currentProvider?.name || 'Local'}`;
  const isPinned = activeConversation?.isPinned;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <Tooltip text="Go back" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go back"
            >
              <ArrowLeft color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </Tooltip>
        ) : !isMasterDetailSupported ? (
          <Tooltip text="Open menu" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}>
            <TouchableOpacity
              onPress={toggleDrawer}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Open menu"
            >
              <Menu color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </Tooltip>
        ) : null}

        <View style={styles.titleContainer}>
          {isEditing ? (
            <View style={styles.titleEditRow}>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 0,
                    borderColor: 'transparent',
                  },
                ]}
                value={editTitle}
                onChangeText={setEditTitle}
                autoFocus
                onSubmitEditing={handleSave}
                returnKeyType="done"
                selectTextOnFocus
                underlineColorAndroid="transparent"
              />
              <Tooltip text="Save title" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel="Save title"
                >
                  <Check color="#fff" size={14} />
                </TouchableOpacity>
              </Tooltip>
              <Tooltip text="Cancel editing" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel="Cancel editing"
                >
                  <X color={colors.textSecondary} size={14} />
                </TouchableOpacity>
              </Tooltip>
            </View>
          ) : (
            <View style={styles.titleTextContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              {displaySubtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {displaySubtitle}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {/* Quick Theme Toggle Icon */}
        <Tooltip text={isDark ? "Switch to light mode" : "Switch to dark mode"} delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Toggle Dark/Light Mode"
          >
            {isDark ? (
              <Sun color={colors.warning} size={19} />
            ) : (
              <Moon color={colors.primary} size={19} />
            )}
          </TouchableOpacity>
        </Tooltip>

        {showNewChat && (
          <Tooltip text="New chat" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
            <TouchableOpacity
              onPress={onNewChat}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="New chat"
            >
              <Plus color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </Tooltip>
        )}

        {/* More Options Popover Trigger (Chat Actions) */}
        {editableTitle && (
          <View style={styles.popoverAnchor}>
            <Tooltip text="More options" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
              <TouchableOpacity
                onPress={() => setIsMenuOpen(!isMenuOpen)}
                style={[
                  styles.iconButton,
                  isMenuOpen && { backgroundColor: colors.backgroundSecondary },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="More chat options"
              >
                <MoreVertical color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </Tooltip>

            {/* Floating Dropdown Popover */}
            {isMenuOpen && (
              <>
                <TouchableOpacity
                  style={styles.menuBackdrop}
                  activeOpacity={1}
                  onPress={() => setIsMenuOpen(false)}
                />
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      shadowColor: colors.textPrimary,
                    },
                  ]}
                >
                  <TouchableOpacity style={styles.menuItem} onPress={handleRenameClick}>
                    <Pencil size={15} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Rename</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={handleTogglePin}>
                    <Pin size={15} color={isPinned ? colors.warning : colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: isPinned ? colors.warning : colors.textPrimary }]}>
                      {isPinned ? 'Unpin' : 'Pin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={handleArchive}>
                    <Archive size={15} color={colors.textPrimary} />
                    <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Archive</Text>
                  </TouchableOpacity>

                  <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

                  <TouchableOpacity style={styles.menuItem} onPress={handleClearChatMessages}>
                    <RotateCcw size={15} color={colors.textSecondary} />
                    <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Clear messages</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={handleDeleteChat}>
                    <Trash2 size={15} color={colors.danger} />
                    <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  titleTextContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.xs,
    marginTop: 1,
  },
  titleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    maxWidth: '100%',
  },
  titleInput: {
    flex: 1,
    height: 34,
    borderRadius: borderRadius.sm,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    outlineStyle: 'none' as any,
    boxShadow: 'none' as any,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverAnchor: {
    position: 'relative',
    zIndex: 1000,
  },
  menuBackdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 175,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: typography.weight.medium,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});
