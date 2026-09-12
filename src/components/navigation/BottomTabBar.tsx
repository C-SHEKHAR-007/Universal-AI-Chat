import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, Library, Cpu, Activity, Settings } from 'lucide-react-native';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { ActiveTab } from '../../types';
import { NAVIGATION_TABS } from '../../constants';

export const BottomTabBar: React.FC = () => {
  const { colors } = useTheme();
  const { activeTab, setActiveTab } = useAppStore();

  const renderTabIcon = (tabId: ActiveTab, isActive: boolean) => {
    const iconColor = isActive ? colors.primary : colors.textMuted;
    switch (tabId) {
      case 'chat':
        return <MessageSquare size={20} color={iconColor} />;
      case 'conversations':
        return <Library size={20} color={iconColor} />;
      case 'models':
        return <Cpu size={20} color={iconColor} />;
      case 'performance':
        return <Activity size={20} color={iconColor} />;
      case 'settings':
        return <Settings size={20} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.borderLight,
        },
      ]}
    >
      {NAVIGATION_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            {renderTabIcon(tab.key, isActive)}
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  tabLabelActive: {
    fontWeight: typography.weight.semibold,
  },
});
