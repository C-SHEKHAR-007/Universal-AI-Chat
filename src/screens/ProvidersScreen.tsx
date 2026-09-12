import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Server,
  Plus,
  Trash2,
  Edit2,
  Zap,
  Check,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Header } from '../components/common/Header';
import { useAppStore } from '../store/appStore';
import { AIProviderConfig } from '../types';
import { ProviderFactory } from '../providers/providerFactory';
import { storage } from '../storage/storageAdapter';
import { DEFAULT_OLLAMA_LAN_URL } from '../constants';

export const ProvidersScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    providers,
    defaultProviderId,
    setDefaultProviderId,
    setAddProviderOpen,
    refreshProviders,
    deleteProvider,
  } = useAppStore();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatuses, setTestStatuses] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const handleTest = async (prov: AIProviderConfig) => {
    setTestingId(prov.id);
    try {
      const p = ProviderFactory.getProvider(prov);
      const res = await p.testConnection();
      setTestStatuses((prev) => ({
        ...prev,
        [prov.id]: { ok: res.success, msg: res.message },
      }));
    } catch (e: any) {
      setTestStatuses((prev) => ({
        ...prev,
        [prov.id]: { ok: false, msg: e.message || 'Offline' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    // Use the store action which handles active/default provider fallback, cache clearing, and model cleanup
    await deleteProvider(id);
    // Clean up test status for the deleted provider
    setTestStatuses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleQuickConnectPC = async () => {
    const pcProvider: AIProviderConfig = {
      id: 'prov_ollama_pc',
      name: `Ollama (${DEFAULT_OLLAMA_LAN_URL})`,
      type: 'ollama',
      baseUrl: DEFAULT_OLLAMA_LAN_URL,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storage.updateProvider(pcProvider);
    await refreshProviders();
    await setDefaultProviderId('prov_ollama_pc');
    handleTest(pcProvider);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="AI Providers" />

      <View style={styles.content}>
        {/* Mobile Wi-Fi Network Hint & Quick Connect Card */}
        <View style={[styles.wifiTipCard, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
          <View style={styles.wifiTipContent}>
            <Text style={[styles.wifiTipTitle, { color: colors.primary }]}>
              📱 Mobile Wi-Fi Endpoint
            </Text>
            <Text style={[styles.wifiTipText, { color: colors.textSecondary }]}>
              On mobile, use your computer's Wi-Fi IP: <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{DEFAULT_OLLAMA_LAN_URL}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.wifiQuickBtn, { backgroundColor: colors.primary }]}
            onPress={handleQuickConnectPC}
          >
            <Zap size={14} color="#fff" />
            <Text style={styles.wifiQuickBtnText}>Connect PC</Text>
          </TouchableOpacity>
        </View>

        {/* Add Provider CTA Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setAddProviderOpen(true)}
          activeOpacity={0.8}
        >
          <Plus color={colors.textPrimary} size={18} />
          <Text style={[styles.addBtnText, { color: colors.textPrimary }]}>Add Custom Provider</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CONNECTED PROVIDERS</Text>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {providers.map((prov) => {
            const isDefault = (defaultProviderId || providers[0]?.id) === prov.id;
            const status = testStatuses[prov.id];
            const isTestingThis = testingId === prov.id;

            return (
              <View
                key={prov.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDefault ? colors.primary : colors.border,
                  },
                  isDefault && { backgroundColor: colors.primaryMuted },
                ]}
              >
                <TouchableOpacity
                  style={styles.mainInfoRow}
                  onPress={() => setDefaultProviderId(prov.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: colors.backgroundSecondary },
                      isDefault && { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Server color={isDefault ? colors.primary : colors.textSecondary} size={22} />
                  </View>

                  <View style={styles.providerDetails}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.providerName, { color: colors.textPrimary }]}>{prov.name}</Text>
                      {isDefault && (
                        <View style={styles.badgeRow}>
                          <Text style={[styles.activeTag, { color: colors.primary, backgroundColor: colors.primaryMuted }]}>
                            DEFAULT
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.providerUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                      {prov.baseUrl}
                    </Text>

                    {/* Status badge */}
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              status && !status.ok ? colors.danger : colors.success,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              status && !status.ok ? colors.danger : colors.success,
                          },
                        ]}
                      >
                        {status ? status.msg : 'Connected'}
                      </Text>
                      {isDefault && (
                        <Text style={[styles.defaultSubtext, { color: colors.textMuted }]}>
                          • Default for new chats
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Actions Footer */}
                <View style={[styles.actionsFooter, { borderTopColor: colors.borderLight }]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleTest(prov)}
                    disabled={isTestingThis}
                  >
                    {isTestingThis ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Zap color={colors.primary} size={14} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Ping</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {!isDefault && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setDefaultProviderId(prov.id)}
                    >
                      <Check color={colors.primary} size={14} />
                      <Text style={[styles.actionBtnTextSecondary, { color: colors.primary, fontWeight: typography.weight.bold }]}>Set Default</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setAddProviderOpen(true, prov)}
                  >
                    <Edit2 color={colors.textSecondary} size={14} />
                    <Text style={[styles.actionBtnTextSecondary, { color: colors.textSecondary }]}>Edit</Text>
                  </TouchableOpacity>

                  {providers.length > 1 && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(prov.id)}
                    >
                      <Trash2 color={colors.danger} size={14} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
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
  wifiTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  wifiTipContent: {
    flex: 1,
  },
  wifiTipTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginBottom: 2,
  },
  wifiTipText: {
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  wifiQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  wifiQuickBtnText: {
    color: '#fff',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: 11,
    marginBottom: spacing.md,
  },
  addBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  scrollArea: {
    flex: 1,
  },
  providerCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  providerName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  activeTag: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultSubtext: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  providerUrl: {
    fontSize: typography.size.xs,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  actionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  actionBtnTextSecondary: {
    fontSize: typography.size.xs,
  },
});
