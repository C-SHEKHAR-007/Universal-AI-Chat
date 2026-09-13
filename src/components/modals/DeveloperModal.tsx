import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  Github,
  Globe,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Tooltip } from '../common/Tooltip';
import { TOOLTIP_CONFIG, DEVELOPER_CONFIG } from '../../constants';

const DEVELOPER_AVATAR = require('../../../assets/developer.jpg');

interface DeveloperModalProps {
  visible: boolean;
  onClose: () => void;
}

// Minimal LinkedIn Icon
const LinkedInIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#0A66C2' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size * 0.8, fontWeight: '800', color, fontFamily: 'monospace', lineHeight: size }}>in</Text>
  </View>
);

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();

  const getSocialIcon = (id: string, color: string) => {
    const iconSize = 18;
    switch (id) {
      case 'email':
        return <Mail color={color} size={iconSize} />;
      case 'whatsapp':
        return <MessageCircle color={color} size={iconSize} />;
      case 'contact':
        return <Phone color={color} size={iconSize} />;
      case 'linkedin':
        return <LinkedInIcon size={iconSize} color={color} />;
      case 'github':
        return <Github color={color} size={iconSize} />;
      case 'portfolio':
        return <Globe color={color} size={iconSize} />;
      default:
        return <Globe color={color} size={iconSize} />;
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Close Button Top Right */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.backgroundSecondary }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close modal"
          >
            <X color={colors.textSecondary} size={16} />
          </TouchableOpacity>

          {/* Centered Minimal Profile Section */}
          <View style={styles.profileSection}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary, borderColor: colors.borderLight }]}>
              <Image
                source={DEVELOPER_AVATAR}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.developerName, { color: colors.textPrimary }]}>
                {DEVELOPER_CONFIG.NAME}
              </Text>
              <Text style={[styles.developerRole, { color: colors.primary }]}>
                {DEVELOPER_CONFIG.ROLE}
              </Text>
            </View>

            <Text style={[styles.developerBio, { color: colors.textSecondary }]}>
              {DEVELOPER_CONFIG.BIO}
            </Text>
          </View>

          {/* Subtle Hairline Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Social Media Nodes Row */}
          <View style={styles.socialSection}>
            <Text style={[styles.socialHeading, { color: colors.textMuted }]}>
              CONNECT
            </Text>

            <View style={styles.socialIconsRow}>
              {DEVELOPER_CONFIG.SOCIAL_LINKS.map((item, index) => {
                const iconColor = item.id === 'github' ? (isDark ? '#fff' : '#24292F') : item.brandColor;
                const icon = getSocialIcon(item.id, iconColor);
                const alignMode = index >= 4 ? 'right' : index === 0 ? 'left' : 'center';

                return (
                  <Tooltip
                    key={item.id}
                    text={item.label}
                    position="top"
                    align={alignMode}
                    delay={TOOLTIP_CONFIG.DEFAULT_DELAY_MS}
                  >
                    <TouchableOpacity
                      style={[
                        styles.socialIconButton,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.borderLight,
                        },
                      ]}
                      onPress={() => handleOpenLink(item.url)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Open ${item.label}`}
                    >
                      {icon}
                    </TouchableOpacity>
                  </Tooltip>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    zIndex: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 100000,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 2,
  },
  developerName: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  developerRole: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  developerBio: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: spacing.lg,
  },
  socialSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  socialHeading: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.8,
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  socialIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
