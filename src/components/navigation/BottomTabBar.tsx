import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, Library, Cpu, Activity, Settings } from 'lucide-react-native';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { ActiveTab } from '../../types';

export const BottomTabBar: React.FC = () => {
  const { colors } = useTheme();
  const { activeTab, setActiveTab } = useAppStore();

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare size={20} color={activeTab === 'chat' ? colors.primary : colors.textMuted} />,
    },
    {
      id: 'conversations',
      label: 'Conversations',
      icon: <Library size={20} color={activeTab === 'conversations' ? colors.primary : colors.textMuted} />,
    },
    {
      id: 'models',
      label: 'Providers',
      icon: <Cpu size={20} color={activeTab === 'models' ? colors.primary : colors.textMuted} />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Activity size={20} color={activeTab === 'performance' ? colors.primary : colors.textMuted} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} color={activeTab === 'settings' ? colors.primary : colors.textMuted} />,
    },
  ];

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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            {tab.icon}
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
