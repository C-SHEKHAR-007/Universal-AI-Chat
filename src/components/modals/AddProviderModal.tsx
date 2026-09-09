import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Server, Check, AlertCircle, Zap } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { ProviderType, AIProviderConfig } from '../../types';
import { ProviderFactory } from '../../providers/providerFactory';
import { storage } from '../../storage/storageAdapter';

export const AddProviderModal: React.FC = () => {
  const { colors } = useTheme();
  const { isAddProviderOpen, setAddProviderOpen, editingProvider, refreshProviders } = useAppStore();

  const [type, setType] = useState<ProviderType>('ollama');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('/v1/chat/completions');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Reset form state every time the modal opens or the editing target changes
  useEffect(() => {
    if (isAddProviderOpen) {
      if (editingProvider) {
        setType(editingProvider.type || 'ollama');
        setName(editingProvider.name || '');
        setBaseUrl(editingProvider.baseUrl || 'http://localhost:11434');
        setApiKey(editingProvider.apiKey || '');
        setCustomEndpoint(editingProvider.customChatEndpoint || '/v1/chat/completions');
      } else {
        // Fresh "Add New" — clear all fields
        setType('ollama');
        setName('');
        setBaseUrl('http://localhost:11434');
        setApiKey('');
        setCustomEndpoint('/v1/chat/completions');
      }
      setIsTesting(false);
      setTestResult(null);
    }
  }, [isAddProviderOpen, editingProvider]);

  if (!isAddProviderOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tempConfig: AIProviderConfig = {
      id: editingProvider?.id || 'temp_' + Date.now(),
      name: name || 'Test Provider',
      type,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      customChatEndpoint: type === 'custom' ? customEndpoint.trim() : undefined,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const provider = ProviderFactory.getProvider(tempConfig);
      const res = await provider.testConnection();
      setTestResult({
        success: res.success,
        message: res.message,
        latency: res.latencyMs,
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const finalName = name.trim() || (type === 'ollama' ? 'Local Ollama' : 'OpenAI Compatible');
    const finalUrl = baseUrl.trim() || 'http://localhost:11434';

    const newProvider: AIProviderConfig = {
      id: editingProvider?.id || 'prov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: finalName,
      type,
      baseUrl: finalUrl,
      apiKey: apiKey.trim(),
      customChatEndpoint: type === 'custom' ? customEndpoint.trim() : undefined,
      isActive: true,
      createdAt: editingProvider?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Invalidate factory cache for this provider (handles edited config)
    ProviderFactory.invalidate(newProvider.id);

    if (editingProvider) {
      await storage.updateProvider(newProvider);
    } else {
      await storage.addProvider(newProvider);
    }

    // Reload providers from storage into state (lightweight, no race condition)
    await refreshProviders();

    // Set this as the active provider (works even before providers are in state)
    useAppStore.getState().setActiveProviderId(newProvider.id);

    // If OpenRouter, seed a default free model
    if (finalUrl.includes('openrouter')) {
      useAppStore.getState().addCustomModel({
        id: 'nvidia/nemotron-3.5-lightning:free',
        name: 'nvidia/nemotron-3.5-lightning:free',
        providerId: newProvider.id,
        providerType: 'openai_compatible',
        contextLength: 1000000,
        parameterSize: 'Free 1M',
      });
      useAppStore.getState().setActiveModelId('nvidia/nemotron-3.5-lightning:free', newProvider.id);
    }

    setAddProviderOpen(false);
  };

  return (
    <Modal visible={isAddProviderOpen} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Server color={colors.primary} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {editingProvider ? 'Edit Provider' : 'Add AI Provider'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddProviderOpen(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Provider Type Radio Options */}
            <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Provider Type</Text>
            <View style={styles.typeRow}>
              {[
                { id: 'ollama' as ProviderType, label: 'Ollama' },
                { id: 'openai_compatible' as ProviderType, label: 'OpenAI Compatible' },
                { id: 'custom' as ProviderType, label: 'Custom API' },
              ].map((item) => {
                const isSelected = type === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                      },
                      isSelected && { backgroundColor: colors.primaryMuted },
                    ]}
                    onPress={() => {
                      setType(item.id);
                      if (item.id === 'ollama' && (!baseUrl || baseUrl.includes('openai'))) {
                        setBaseUrl('http://localhost:11434');
                      } else if (item.id !== 'ollama' && baseUrl.includes('11434')) {
                        setBaseUrl('https://api.openai.com');
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? colors.primary : colors.border },
                      ]}
                    >
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? colors.textPrimary : colors.textSecondary },
                        isSelected && styles.typeTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Popular Presets */}
            {type === 'openai_compatible' && (
              <View style={styles.presetsContainer}>
                <Text style={[styles.hintText, { color: colors.textMuted, marginBottom: 8 }]}>
                  Quick Fill Preset:
                </Text>
                <View style={styles.presetChipsRow}>
                  {[
                    { label: '⚡ OpenRouter', name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
                    { label: 'Groq', name: 'Groq', url: 'https://api.groq.com/openai/v1' },
                    { label: 'DeepSeek', name: 'DeepSeek', url: 'https://api.deepseek.com' },
                    { label: 'OpenAI', name: 'OpenAI', url: 'https://api.openai.com' },
                  ].map((preset) => {
                    const isPicked = baseUrl === preset.url;
                    return (
                      <TouchableOpacity
                        key={preset.name}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isPicked ? colors.primaryMuted : colors.backgroundSecondary,
                            borderColor: isPicked ? colors.primary : colors.borderLight,
                          },
                        ]}
                        onPress={() => {
                          setName(preset.name);
                          setBaseUrl(preset.url);
                        }}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            { color: isPicked ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Provider Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={type === 'ollama' ? 'e.g. My Local AI' : 'e.g. vLLM Server'}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Base URL */}
            <View style={styles.inputGroup}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Base URL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="http://192.168.1.20:11434"
                placeholderTextColor={colors.textMuted}
                value={baseUrl}
                onChangeText={setBaseUrl}
                autoCapitalize="none"
              />
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Use LAN IP (e.g. 192.168.x.x:11434) for remote devices or 10.0.2.2 for Android Emulator.
              </Text>
            </View>

            {/* API Key (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>API Key (Optional for Ollama)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderLight,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="sk-..."
                placeholderTextColor={colors.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Custom Endpoint (Only for Custom API) */}
            {type === 'custom' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>Chat Completion Endpoint</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderLight,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="/v1/chat/completions"
                  placeholderTextColor={colors.textMuted}
                  value={customEndpoint}
                  onChangeText={setCustomEndpoint}
                  autoCapitalize="none"
                />
                <Text style={[styles.hintText, { color: colors.textMuted }]}>
                  Specify the path to your server's chat endpoint (e.g. /v1/chat/completions or /api/v1/generate).
                </Text>
              </View>
            )}

            {/* Test Connection Button & Result */}
            <View style={styles.testSection}>
              <TouchableOpacity
                style={[
                  styles.testBtn,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryMuted,
                  },
                ]}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Zap color={colors.primary} size={15} />
                    <Text style={[styles.testBtnText, { color: colors.primary }]}>Test Connection</Text>
                  </>
                )}
              </TouchableOpacity>

              {testResult && (
                <View
                  style={[
                    styles.resultCard,
                    testResult.success
                      ? { backgroundColor: colors.successLight, borderColor: colors.success }
                      : { backgroundColor: colors.dangerLight, borderColor: colors.danger },
                  ]}
                >
                  {testResult.success ? (
                    <Check color={colors.success} size={16} />
                  ) : (
                    <AlertCircle color={colors.danger} size={16} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.resultText,
                        { color: testResult.success ? colors.success : colors.danger },
                      ]}
                    >
                      {testResult.message}
                    </Text>
                    {testResult.latency !== undefined && (
                      <Text style={[styles.latencyText, { color: colors.textSecondary }]}>
                        Latency: {testResult.latency}ms
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>
                {editingProvider ? 'Update Provider' : 'Save Provider'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    maxHeight: 460,
  },
  groupLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    gap: 8,
    marginBottom: spacing.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  typeTextSelected: {
    fontWeight: typography.weight.semibold,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: typography.size.sm,
  },
  hintText: {
    fontSize: 11,
    marginTop: 4,
  },
  testSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  testBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  resultText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  latencyText: {
    fontSize: 10,
    marginTop: 2,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  presetsContainer: {
    marginBottom: spacing.md,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full || 16,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
});
