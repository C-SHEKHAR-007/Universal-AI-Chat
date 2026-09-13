import React, { useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar, Keyboard, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { useTheme } from './src/theme/useTheme';
import { useResponsive } from './src/hooks/useResponsive';
import { useAppStore } from './src/store/appStore';
import { getConversationIdFromUrl, onUrlConversationChange } from './src/utils/urlSync';

// Screens
import { ChatScreen } from './src/screens/ChatScreen';
import { ConversationsScreen } from './src/screens/ConversationsScreen';
import { ProvidersScreen } from './src/screens/ProvidersScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Navigation Components
import { MobileDrawer } from './src/components/navigation/MobileDrawer';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { TabletSidebar } from './src/components/navigation/TabletSidebar';

// Modals
import { ModelSelectorModal } from './src/components/modals/ModelSelectorModal';
import { ChatSettingsModal } from './src/components/modals/ChatSettingsModal';
import { AddProviderModal } from './src/components/modals/AddProviderModal';

export default function App() {
  const { colors, isDark } = useTheme();
  const { isMasterDetailSupported } = useResponsive();
  const { activeTab, loadInitialData, setActiveConversationId } = useAppStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Load initial data, then restore conversation from URL if present
    loadInitialData().then(async () => {
      const urlConvId = getConversationIdFromUrl();
      if (urlConvId) {
        await setActiveConversationId(urlConvId);
      }
    });

    // Listen for browser back/forward navigation (web only)
    const unsubscribeUrl = onUrlConversationChange((convId) => {
      setActiveConversationId(convId);
    });

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );

    // Android Hardware / Gesture Back Button Handler
    const handleHardwareBack = () => {
      const state = useAppStore.getState();
      if (state.isModelSelectorOpen) {
        state.setModelSelectorOpen(false);
        return true;
      }
      if (state.isChatSettingsOpen) {
        state.setChatSettingsOpen(false);
        return true;
      }
      if (state.isAddProviderOpen) {
        state.setAddProviderOpen(false);
        return true;
      }
      if (state.isDrawerOpen) {
        state.setDrawerOpen(false);
        return true;
      }
      if (state.activeTab !== 'chat') {
        state.setActiveTab('chat');
        return true;
      }
      return false; // Exit app if already at root chat with no open modals
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);

    return () => {
      unsubscribeUrl();
      showSub.remove();
      hideSub.remove();
      backSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.background;
      document.documentElement.style.backgroundColor = colors.background;

      const styleId = 'uai-global-reset';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          textarea, input {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent;
          }
          textarea:focus, input:focus, textarea:focus-visible, input:focus-visible, *:focus, *:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [colors.background]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'conversations':
        return <ConversationsScreen />;
      case 'models':
        return <ProvidersScreen />;
      case 'performance':
        return <PerformanceScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />

        <View style={[styles.mainLayout, { backgroundColor: colors.background }]}>
          {/* Tablet Master-Detail Dual Pane View */}
          {isMasterDetailSupported && <TabletSidebar />}

          {/* Main Content Area */}
          <View style={styles.contentPane}>
            {renderActiveScreen()}
          </View>
        </View>

        {/* Mobile Slide-Out Drawer & Bottom Navigation Tabs */}
        {!isMasterDetailSupported && (
          <>
            <MobileDrawer />
            {!isKeyboardOpen && <BottomTabBar />}
          </>
        )}

        {/* Modals */}
        <ModelSelectorModal />
        <ChatSettingsModal />
        <AddProviderModal />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  contentPane: {
    flex: 1,
    height: '100%',
  },
});
