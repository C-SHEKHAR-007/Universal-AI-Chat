import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Menu, MoreVertical, ArrowLeft, Plus, Sun, Moon, HardDrive, Pencil, Check, X } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { useResponsive } from '../../hooks/useResponsive';
import { APP_NAME, TOOLTIP_CONFIG } from '../../constants';

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
  onOptionsPress,
  editableTitle = false,
  onTitleSave,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { toggleDrawer, activeModelId, activeProviderId, providers, chatParameters } = useAppStore();
  const { isMasterDetailSupported } = useResponsive();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

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

  const currentProvider = providers.find((p) => p.id === activeProviderId);
  const displaySubtitle = subtitle || `${activeModelId} • ${currentProvider?.name || 'Local'}`;

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
                    borderColor: colors.primary,
                  },
                ]}
                value={editTitle}
                onChangeText={setEditTitle}
                autoFocus
                onSubmitEditing={handleSave}
                returnKeyType="done"
                selectTextOnFocus
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
          ) : editableTitle ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.titleTouchable}
              activeOpacity={0.7}
              accessibilityLabel="Edit chat title"
            >
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                <Pencil color={colors.textMuted} size={13} style={styles.pencilIcon} />
              </View>
              {displaySubtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {displaySubtitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <>
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
            </>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {/* Quick Theme Toggle Icon directly in Header */}
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

        {onOptionsPress && (
          <Tooltip text="Context window & parameters" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
            <TouchableOpacity
              onPress={onOptionsPress}
              style={[
                styles.contextPill,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.borderLight,
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Context Window and Settings"
            >
              <HardDrive color={colors.primary} size={12} />
              <Text style={[styles.contextPillText, { color: colors.textSecondary }]}>
                {chatParameters.contextWindow >= 1024
                  ? `${Math.round(chatParameters.contextWindow / 1024)}k`
                  : chatParameters.contextWindow}
              </Text>
            </TouchableOpacity>
          </Tooltip>
        )}

        {onOptionsPress && (
          <Tooltip text="Chat settings" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
            <TouchableOpacity
              onPress={onOptionsPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Chat settings"
            >
              <MoreVertical color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </Tooltip>
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
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: 2,
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  titleTouchable: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  pencilIcon: {
    opacity: 0.7,
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
  },
  titleInput: {
    flex: 1,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
