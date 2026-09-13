import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  PanResponder,
  useWindowDimensions,
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
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Tooltip } from '../common/Tooltip';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import { APP_NAME, TOOLTIP_CONFIG, SIDEBAR_CONFIG } from '../../constants';

export const TabletSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  const { width: windowWidth } = useWindowDimensions();

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
    sidebarWidth,
    setSidebarWidth,
    isSidebarCollapsed,
    setSidebarCollapsed,
    saveSidebarState,
  } = useAppStore();
  const { loadMessages, clearActiveChat } = useChatStore();

  const maxAllowedWidth = Math.min(
    SIDEBAR_CONFIG.MAX_WIDTH,
    Math.max(SIDEBAR_CONFIG.MIN_WIDTH + 60, windowWidth * 0.45)
  );

  // Ref to hold live width for PanResponder & Mouse handlers
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;
  const isCollapsedRef = useRef(isSidebarCollapsed);
  isCollapsedRef.current = isSidebarCollapsed;

  // Track the user's custom expanded width to restore smoothly when uncollapsing
  const lastExpandedWidthRef = useRef(
    sidebarWidth >= SIDEBAR_CONFIG.MIN_WIDTH ? sidebarWidth : SIDEBAR_CONFIG.DEFAULT_WIDTH
  );
  if (!isSidebarCollapsed && sidebarWidth >= SIDEBAR_CONFIG.MIN_WIDTH) {
    lastExpandedWidthRef.current = sidebarWidth;
  }

  // Corner Case: If window shrinks, auto-clamp sidebar width so chat pane is never squished
  useEffect(() => {
    if (!isSidebarCollapsed && sidebarWidth > maxAllowedWidth) {
      setSidebarWidth(maxAllowedWidth, true);
    }
  }, [windowWidth, maxAllowedWidth, sidebarWidth, isSidebarCollapsed, setSidebarWidth]);

  // Corner Case: Cleanup global document styles on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  const COLLAPSE_THRESHOLD = 150;

  // React Native PanResponder for Touch / Native drag
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_evt, gestureState) => {
        const baseWidth = isCollapsedRef.current ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : sidebarWidthRef.current;
        const targetWidth = baseWidth + gestureState.dx;

        if (targetWidth < COLLAPSE_THRESHOLD) {
          if (!isCollapsedRef.current) {
            setSidebarCollapsed(true, false);
          }
        } else {
          if (isCollapsedRef.current) {
            setSidebarCollapsed(false, false);
          }
          const clamped = Math.max(
            SIDEBAR_CONFIG.MIN_WIDTH,
            Math.min(maxAllowedWidth, Math.round(targetWidth))
          );
          setSidebarWidth(clamped, false);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        saveSidebarState();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        saveSidebarState();
      },
    })
  ).current;

  // Web Mouse / Pointer Drag Handler with requestAnimationFrame for 60+ FPS smooth dragging
  const handleMouseDown = useCallback((e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = isCollapsedRef.current ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : sidebarWidthRef.current;

    let rafId: number | null = null;
    let latestClientX = startX;

    const updatePosition = () => {
      rafId = null;
      const delta = latestClientX - startX;
      const targetWidth = startWidth + delta;

      if (targetWidth < COLLAPSE_THRESHOLD) {
        if (!isCollapsedRef.current) {
          setSidebarCollapsed(true, false);
        }
      } else {
        if (isCollapsedRef.current) {
          setSidebarCollapsed(false, false);
        }
        const clamped = Math.max(
          SIDEBAR_CONFIG.MIN_WIDTH,
          Math.min(maxAllowedWidth, Math.round(targetWidth))
        );
        setSidebarWidth(clamped, false);
      }
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      latestClientX = moveEvent.clientX;
      if (rafId === null) {
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const onMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsDragging(false);
      saveSidebarState();

      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onMouseMove, { capture: true } as any);
        window.removeEventListener('mouseup', onMouseUp, { capture: true } as any);
        window.removeEventListener('blur', onMouseUp, { capture: true } as any);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', onMouseMove, { capture: true, passive: false });
      window.addEventListener('mouseup', onMouseUp, { capture: true });
      window.addEventListener('blur', onMouseUp, { capture: true });
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }
    }
  }, [maxAllowedWidth, setSidebarCollapsed, setSidebarWidth, saveSidebarState]);

  const handleDoubleClick = useCallback(() => {
    if (isSidebarCollapsed) {
      const target = Math.max(
        SIDEBAR_CONFIG.MIN_WIDTH,
        Math.min(maxAllowedWidth, lastExpandedWidthRef.current || SIDEBAR_CONFIG.DEFAULT_WIDTH)
      );
      setSidebarCollapsed(false);
      setSidebarWidth(target);
    } else {
      setSidebarCollapsed(true);
    }
  }, [isSidebarCollapsed, maxAllowedWidth, setSidebarCollapsed, setSidebarWidth]);

  const handleExpandFromRail = useCallback(() => {
    const target = Math.max(
      SIDEBAR_CONFIG.MIN_WIDTH,
      Math.min(maxAllowedWidth, lastExpandedWidthRef.current || SIDEBAR_CONFIG.DEFAULT_WIDTH)
    );
    setSidebarCollapsed(false);
    setSidebarWidth(target);
  }, [maxAllowedWidth, setSidebarCollapsed, setSidebarWidth]);

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

  if (isSidebarCollapsed) {
    return (
      <View
        style={[
          styles.collapsedContainer,
          {
            width: SIDEBAR_CONFIG.COLLAPSED_WIDTH,
            backgroundColor: colors.backgroundSecondary,
            borderRightColor: colors.border,
          },
        ]}
      >
        {/* Top: Expand Sidebar Button */}
        <View style={styles.collapsedHeader}>
          <Tooltip text="Expand sidebar" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              onPress={handleExpandFromRail}
              style={[styles.collapsedIconBtn, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Expand sidebar"
            >
              <ChevronsRight color={colors.primary} size={18} />
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* New Chat Button */}
        <Tooltip text="New chat" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
          <TouchableOpacity
            style={[styles.collapsedNewChatBtn, { backgroundColor: colors.primary }]}
            onPress={handleNewChat}
            accessibilityLabel="New chat"
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={20} />
          </TouchableOpacity>
        </Tooltip>

        {/* Navigation Items (Icons Only) */}
        <View style={styles.collapsedNavSection}>
          <Tooltip text="Conversations" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              style={[
                styles.collapsedNavBtn,
                activeTab === 'conversations' && { backgroundColor: colors.primaryMuted },
              ]}
              onPress={() => setActiveTab('conversations')}
              accessibilityLabel="Conversations"
            >
              <MessageSquare
                color={activeTab === 'conversations' ? colors.primary : colors.textSecondary}
                size={19}
              />
            </TouchableOpacity>
          </Tooltip>

          <Tooltip text="Models & Providers" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              style={[
                styles.collapsedNavBtn,
                activeTab === 'models' && { backgroundColor: colors.primaryMuted },
              ]}
              onPress={() => setActiveTab('models')}
              accessibilityLabel="Models & Providers"
            >
              <Cpu
                color={activeTab === 'models' ? colors.primary : colors.textSecondary}
                size={19}
              />
            </TouchableOpacity>
          </Tooltip>

          <Tooltip text="Performance" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              style={[
                styles.collapsedNavBtn,
                activeTab === 'performance' && { backgroundColor: colors.primaryMuted },
              ]}
              onPress={() => setActiveTab('performance')}
              accessibilityLabel="Performance"
            >
              <Activity
                color={activeTab === 'performance' ? colors.primary : colors.textSecondary}
                size={19}
              />
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Flexible spacer */}
        <View style={styles.collapsedSpacer} />

        {/* Bottom Footer: Settings & Theme Toggle */}
        <View style={[styles.collapsedFooter, { borderTopColor: colors.borderLight }]}>
          <Tooltip text="Settings" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              style={[
                styles.collapsedNavBtn,
                activeTab === 'settings' && { backgroundColor: colors.primaryMuted },
              ]}
              onPress={() => setActiveTab('settings')}
              accessibilityLabel="Settings"
            >
              <Settings
                color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
                size={19}
              />
            </TouchableOpacity>
          </Tooltip>

          <Tooltip text={isDark ? "Switch to light mode" : "Switch to dark mode"} delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="left">
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.collapsedNavBtn, { marginTop: 4 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Toggle theme"
            >
              {isDark ? <Sun color={colors.warning} size={18} /> : <Moon color={colors.primary} size={18} />}
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Draggable & Stretchable Resize Handle on Collapsed Rail */}
        <View
          style={[styles.resizeHandle, isDragging && styles.resizeHandleActive]}
          {...panResponder.panHandlers}
          {...(Platform.OS === 'web' ? {
            onMouseDown: handleMouseDown,
            onDoubleClick: handleDoubleClick,
            onMouseEnter: () => setIsHoveringHandle(true),
            onMouseLeave: () => setIsHoveringHandle(false),
          } as any : {})}
        >
          <View
            style={[
              styles.resizeGripLine,
              {
                backgroundColor: isDragging
                  ? colors.primary
                  : isHoveringHandle
                  ? colors.border
                  : 'transparent',
              },
            ]}
          />
        </View>

        {isDragging && Platform.OS === 'web' && (
          <View style={styles.dragOverlay} pointerEvents="none" />
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: sidebarWidth,
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

        <View style={styles.brandActions}>
          <Tooltip text="Collapse sidebar" delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}>
            <TouchableOpacity
              onPress={() => setSidebarCollapsed(true)}
              style={styles.headerActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Collapse sidebar"
            >
              <ChevronsLeft color={colors.textSecondary} size={18} />
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

      {/* Footer: Unified Settings & Theme Toggle Bar */}
      <View style={[styles.footerWrapper, { borderTopColor: colors.borderLight }]}>
        <View
          style={[
            styles.unifiedFooterBar,
            {
              backgroundColor: activeTab === 'settings' ? colors.primaryMuted : colors.card,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.settingsAction}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
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

          <View style={[styles.footerDivider, { backgroundColor: colors.borderLight }]} />

          <Tooltip text={isDark ? "Switch to light mode" : "Switch to dark mode"} delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS} align="right">
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Toggle theme"
              activeOpacity={0.7}
            >
              {isDark ? (
                <Sun color={colors.warning} size={17} />
              ) : (
                <Moon color={colors.primary} size={17} />
              )}
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>

      {/* Draggable & Stretchable Resize Handle */}
      <View
        style={[
          styles.resizeHandle,
          isDragging && styles.resizeHandleActive,
        ]}
        {...panResponder.panHandlers}
        {...(Platform.OS === 'web' ? {
          onMouseDown: handleMouseDown,
          onDoubleClick: handleDoubleClick,
          onMouseEnter: () => setIsHoveringHandle(true),
          onMouseLeave: () => setIsHoveringHandle(false),
        } as any : {})}
      >
        <View
          style={[
            styles.resizeGripLine,
            {
              backgroundColor: isDragging
                ? colors.primary
                : isHoveringHandle
                ? colors.border
                : 'transparent',
            },
          ]}
        />
        <View
          style={[
            styles.resizeGripPill,
            {
              backgroundColor: isDragging
                ? colors.primary
                : isHoveringHandle
                ? colors.textMuted
                : colors.borderLight,
            },
          ]}
        />
      </View>

      {isDragging && Platform.OS === 'web' && (
        <View style={styles.dragOverlay} pointerEvents="none" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRightWidth: 1,
    padding: spacing.md,
    height: '100%',
    position: 'relative',
  },
  collapsedContainer: {
    borderRightWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },
  collapsedHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  collapsedIconBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedNewChatBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  collapsedNavSection: {
    gap: 6,
    alignItems: 'center',
    width: '100%',
  },
  collapsedNavBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedSpacer: {
    flex: 1,
  },
  collapsedFooter: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 4,
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -7,
    width: 14,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'col-resize', userSelect: 'none' } as any) : {}),
  },
  resizeHandleActive: {
    zIndex: 10000,
  },
  dragOverlay: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    ...(Platform.OS === 'web' ? ({ cursor: 'col-resize', userSelect: 'none' } as any) : {}),
  },
  resizeGripLine: {
    width: 2,
    height: '100%',
  },
  resizeGripPill: {
    position: 'absolute',
    width: 4,
    height: 28,
    borderRadius: 2,
    top: '50%',
    marginTop: -14,
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
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  footerWrapper: {
    borderTopWidth: 1,
    marginTop: spacing.xs,
    paddingTop: 8,
  },
  unifiedFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  settingsAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  settingsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  settingsTextActive: {
    fontWeight: typography.weight.semibold,
  },
  footerDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 2,
  },
  themeActionBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
