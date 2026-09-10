import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Search, Check, Cpu, Zap, HardDrive, Plus, Server } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { useAppStore } from '../../store/appStore';
import { ProviderFactory } from '../../providers/providerFactory';
import { ModelMeta } from '../../types';

export const ModelSelectorModal: React.FC = () => {
  const { colors } = useTheme();
  const {
    isModelSelectorOpen,
    setModelSelectorOpen,
    models,
    activeModelId,
    setActiveModelId,
    activeProviderId,
    providers,
    addCustomModel,
    setModelsForProvider,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState(activeProviderId);

  useEffect(() => {
    if (isModelSelectorOpen) {
      setSelectedProviderId(activeProviderId);
    }
  }, [isModelSelectorOpen, activeProviderId]);

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  useEffect(() => {
    if (!isModelSelectorOpen || !currentProvider) return;
    let isMounted = true;
    (async () => {
      try {
        const prov = ProviderFactory.getProvider(currentProvider);
        const fetched = await prov.getModels();
        if (isMounted && fetched && fetched.length > 0) {
          // Replace all models for this provider with freshly fetched ones
          setModelsForProvider(currentProvider.id, fetched);
        }
      } catch {
        // Silently keep current models on network issues
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isModelSelectorOpen, selectedProviderId]);

  if (!isModelSelectorOpen) return null;

  // Filter models to ONLY show models of the currently selected provider tab (strict providerId match)
  const providerModels = models.filter((m) => m.providerId === selectedProviderId);

  const filteredModels = providerModels.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filteredModels.some(
    (m) =>
      m.name.toLowerCase() === search.trim().toLowerCase() ||
      m.id.toLowerCase() === search.trim().toLowerCase()
  );

  const handleSelect = (model: ModelMeta) => {
    setActiveModelId(model.id, model.providerId || selectedProviderId);
    setModelSelectorOpen(false);
  };

  const handleSelectCustom = (customId: string) => {
    const trimmed = customId.trim();
    if (!trimmed) return;
    const customModel: ModelMeta = {
      id: trimmed,
      name: trimmed,
      providerId: selectedProviderId,
      providerType: currentProvider?.type || 'openai_compatible',
      contextLength: 100000,
    };
    addCustomModel(customModel);
    setActiveModelId(trimmed, selectedProviderId);
    setModelSelectorOpen(false);
  };

  return (
    <Modal visible={isModelSelectorOpen} transparent animationType="slide">
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Select Model</Text>
            <TouchableOpacity
              onPress={() => setModelSelectorOpen(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Provider Selection Tabs */}
          <View style={styles.providerSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROVIDER</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providerTabsRow}
            >
              {providers.map((p) => {
                const isCurrent = p.id === selectedProviderId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.providerTab,
                      {
                        backgroundColor: isCurrent ? colors.primary : colors.backgroundSecondary,
                        borderColor: isCurrent ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => setSelectedProviderId(p.id)}
                    activeOpacity={0.7}
                  >
                    <Server size={12} color={isCurrent ? '#fff' : colors.textSecondary} />
                    <Text
                      style={[
                        styles.providerTabText,
                        {
                          color: isCurrent ? '#fff' : colors.textPrimary,
                          fontWeight: isCurrent ? typography.weight.bold : typography.weight.medium,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Search color={colors.textMuted} size={16} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={`Search models in ${currentProvider?.name || 'provider'}...`}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Models List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {search.trim().length > 0 && !exactMatch && (
              <TouchableOpacity
                style={[
                  styles.modelCard,
                  {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                  },
                ]}
                onPress={() => handleSelectCustom(search.trim())}
                activeOpacity={0.7}
              >
                <View style={[styles.modelIcon, { backgroundColor: colors.primary }]}>
                  <Plus color="#fff" size={20} />
                </View>

                <View style={styles.modelInfo}>
                  <Text style={[styles.modelName, { color: colors.primary }]}>
                    Use "{search.trim()}"
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Select custom model ID for {currentProvider?.name || 'active provider'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {filteredModels.map((model) => {
              const isSelected = activeModelId === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                    isSelected && { backgroundColor: colors.primaryMuted },
                  ]}
                  onPress={() => handleSelect(model)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modelIcon, { backgroundColor: colors.card }]}>
                    <Cpu color={isSelected ? colors.primary : colors.textSecondary} size={20} />
                  </View>

                  <View style={styles.modelInfo}>
                    <View style={styles.modelTitleRow}>
                      <Text
                        style={[
                          styles.modelName,
                          { color: colors.textPrimary },
                          isSelected && { color: colors.primary },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {model.name}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      {model.parameterSize && (
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {model.parameterSize}
                        </Text>
                      )}
                      {model.fileSizeFormatted && (
                        <>
                          <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                          <View style={styles.metaWithIcon}>
                            <HardDrive color={colors.textMuted} size={11} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {model.fileSizeFormatted}
                            </Text>
                          </View>
                        </>
                      )}
                      {model.avgSpeedTokPerSec && (
                        <>
                          <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                          <View style={styles.metaWithIcon}>
                            <Zap color={colors.success} size={11} />
                            <Text style={[styles.metaText, { color: colors.success }]}>
                              ~{model.avgSpeedTokPerSec} tok/s
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  >
                    {isSelected && <Check color="#fff" size={13} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredModels.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {search.trim().length > 0
                    ? `No models matching "${search}" found in ${currentProvider?.name}.`
                    : `No models currently cached for ${currentProvider?.name}. Type above to use any model ID.`}
                </Text>
              </View>
            )}
          </ScrollView>
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
    maxHeight: '85%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  list: {
    maxHeight: 380,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  modelIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelInfo: {
    flex: 1,
  },
  modelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modelName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: typography.size.xs,
  },
  metaDot: {
    fontSize: 10,
  },
  metaWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerSection: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  providerTabsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  providerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full || 16,
    borderWidth: 1,
  },
  providerTabText: {
    fontSize: typography.size.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
