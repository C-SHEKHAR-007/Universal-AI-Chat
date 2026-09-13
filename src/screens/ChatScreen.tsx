import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { ArrowDown } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { EmptyChatState } from '../components/chat/EmptyChatState';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { useTheme } from '../theme/useTheme';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { APP_NAME, DEFAULT_CHAT_TITLE } from '../constants';

export const ChatScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollEnabled = useRef(true);

  const { colors } = useTheme();
  const {
    activeConversation,
    activeConversationId,
    createConversation,
    updateConversationTitle,
    setChatSettingsOpen,
  } = useAppStore();
  const {
    messages,
    isStreaming,
    streamingMessageId,
    streamingContent,
    sendMessage,
    regenerateLastMessage,
    deleteMessage,
    editAndResendMessage,
    clearActiveChat,
  } = useChatStore();

  const keyboardBehavior = Platform.select({
    ios: 'padding',
    android: undefined,
    default: undefined,
  }) as 'padding' | undefined;

  // Auto-scroll to bottom when keyboard opens so active chat messages stay in view
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    return () => {
      showSub.remove();
    };
  }, []);

  // Autoscroll to bottom on new messages or during live stream unless user scrolled up
  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, streamingContent]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    isAutoScrollEnabled.current = isCloseToBottom;
    setShowScrollBottom(!isCloseToBottom && contentSize.height > layoutMeasurement.height + 150);
  };

  const scrollToBottom = () => {
    isAutoScrollEnabled.current = true;
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollBottom(false);
  };

  const handleSend = (text: string) => {
    isAutoScrollEnabled.current = true;
    sendMessage(text);
  };

  const handleEditAndResend = (messageId: string, newPrompt: string) => {
    isAutoScrollEnabled.current = true;
    editAndResendMessage(messageId, newPrompt);
  };

  const handleNewChat = async () => {
    clearActiveChat();
    await createConversation(DEFAULT_CHAT_TITLE);
  };

  const hasMessages = messages.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header
        title={activeConversation?.title || APP_NAME}
        editableTitle={!!activeConversationId}
        onTitleSave={(newTitle) => {
          if (activeConversationId) {
            updateConversationTitle(activeConversationId, newTitle, true);
          }
        }}
        showNewChat={hasMessages}
        onNewChat={handleNewChat}
      />

      <View style={styles.chatArea}>
        {!hasMessages ? (
          <ScrollView
            style={styles.emptyScrollWrapper}
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <EmptyChatState onSelectPrompt={handleSend} />
          </ScrollView>
        ) : (
          <View style={styles.scrollWrapper}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageScroll}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onScroll={handleScroll}
              scrollEventThrottle={100}
            >
              {messages.map((msg) => {
                const isCurrentlyStreaming = isStreaming && msg.id === streamingMessageId;
                const displayMessage = isCurrentlyStreaming
                  ? { ...msg, content: streamingContent }
                  : msg;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={displayMessage}
                    isStreaming={isCurrentlyStreaming}
                    onRegenerate={msg.role === 'assistant' ? regenerateLastMessage : undefined}
                    onDelete={deleteMessage}
                    onEditAndResend={msg.role === 'user' ? handleEditAndResend : undefined}
                  />
                );
              })}
            </ScrollView>

            {/* Floating Scroll To Bottom Button */}
            {showScrollBottom && (
              <TouchableOpacity
                style={[
                  styles.scrollBottomBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: colors.textPrimary,
                  },
                ]}
                onPress={scrollToBottom}
                activeOpacity={0.8}
              >
                <ArrowDown color={colors.primary} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ChatInputBar onSend={handleSend} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  emptyScrollWrapper: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  messageScroll: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 14,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },
  scrollBottomBtn: {
    position: 'absolute',
    bottom: 16,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
