import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  Moon,
  Sun,
  HardDrive,
  ShieldCheck,
  Info,
  ChevronRight,
  Trash2,
  Download,
  CheckCircle2,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Header } from '../components/common/Header';
import { useAppStore } from '../store/appStore';
import { storage } from '../storage/storageAdapter';
import { APP_NAME, APP_VERSION, APP_SUBTITLE, TOAST_DURATION_MS } from '../constants';

export const SettingsScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [streamStats, setStreamStats] = useState(true);
  const [clearedMsg, setClearedMsg] = useState(false);
  const { loadInitialData } = useAppStore();

  const handleClearHistory = async () => {
    await storage.saveConversations([]);
    await loadInitialData();
    setClearedMsg(true);
    setTimeout(() => setClearedMsg(false), TOAST_DURATION_MS);
  };

  const handleExportData = async () => {
    const convs = await storage.getConversations();
    const providers = await storage.getProviders();
    const benchmarks = await storage.getBenchmarks();
    const payload = JSON.stringify({ conversations: convs, providers, benchmarks }, null, 2);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payload);
      alert('Application backup copied to clipboard in JSON format!');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        {/* Appearance Group */}
        <View style={styles.group}>
          <Text style={[styles.groupHeader, { color: colors.textMuted }]}>APPEARANCE & DISPLAY</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                {isDark ? (
                  <Moon color={colors.primary} size={20} />
                ) : (
                  <Sun color={colors.warning} size={20} />
                )}
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    {isDark ? 'Charcoal black dark theme (click to switch to light)' : 'Clean crisp light theme (click to switch to dark)'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Info color={colors.purple} size={20} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Show Live Generation Speed
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Display real-time tok/s pill on responses
                  </Text>
                </View>
              </View>
              <Switch
                value={streamStats}
                onValueChange={setStreamStats}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Storage Group */}
        <View style={styles.group}>
          <Text style={[styles.groupHeader, { color: colors.textMuted }]}>STORAGE & LOCAL DATABASE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.row} onPress={handleExportData}>
              <View style={styles.rowLeft}>
                <Download color={colors.success} size={20} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Backup Data</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Export conversations & benchmarks
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
              <View style={styles.rowLeft}>
                <Trash2 color={colors.danger} size={20} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.danger }]}>
                    Clear All Conversations
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Reset local SQLite database
                  </Text>
                </View>
              </View>
              {clearedMsg ? (
                <CheckCircle2 color={colors.success} size={20} />
              ) : (
                <ChevronRight color={colors.textMuted} size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Group */}
        <View style={styles.group}>
          <Text style={[styles.groupHeader, { color: colors.textMuted }]}>SECURITY & PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <ShieldCheck color={colors.success} size={20} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Local-First Encryption
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    API keys stored in secure sandbox
                  </Text>
                </View>
              </View>
              <View style={[styles.secureBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.secureBadgeText, { color: colors.success }]}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Group */}
        <View style={styles.group}>
          <Text style={[styles.groupHeader, { color: colors.textMuted }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Info color={colors.textSecondary} size={20} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    {APP_NAME}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    {APP_SUBTITLE}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tagVersion, { color: colors.textMuted }]}>v{APP_VERSION}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  group: {
    marginBottom: spacing.xs,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  rowSub: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  secureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  tagVersion: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
});
