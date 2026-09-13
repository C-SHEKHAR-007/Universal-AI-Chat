import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileCode, Copy, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { copyToClipboard } from '../../utils';
import { StreamingCursor } from './StreamingCursor';

export interface CodeBlockProps {
  code: string;
  language: string;
  isStreaming?: boolean;
}

const CodeBlockComponent: React.FC<CodeBlockProps> = ({
  code,
  language,
  isStreaming = false,
}) => {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View
      style={[
        styles.codeContainer,
        {
          backgroundColor: colors.codeBg,
          borderColor: colors.codeBorder,
        },
      ]}
    >
      <View
        style={[
          styles.codeHeader,
          {
            backgroundColor: colors.codeHeader,
            borderBottomColor: colors.codeBorder,
          },
        ]}
      >
        <View style={styles.codeHeaderLeft}>
          <FileCode color={colors.textSecondary} size={14} />
          <Text style={[styles.codeLanguage, { color: colors.textSecondary }]}>
            {language || 'code'}
          </Text>
        </View>
        <TouchableOpacity style={styles.codeCopyButton} onPress={handleCopyCode}>
          {copied ? (
            <Check color={colors.success} size={13} />
          ) : (
            <Copy color={colors.textSecondary} size={13} />
          )}
          <Text
            style={[
              styles.codeCopyText,
              { color: copied ? colors.success : colors.textSecondary },
            ]}
          >
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.codeBody}>
        <Text style={[styles.codeText, { color: colors.codeText }]}>
          {code}
          {isStreaming && <StreamingCursor />}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  codeContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  codeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLanguage: {
    fontSize: typography.size.xs,
    fontFamily: 'monospace',
    textTransform: 'lowercase',
    fontWeight: typography.weight.medium,
  },
  codeCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  codeCopyText: {
    fontSize: typography.size.xs,
  },
  codeBody: {
    padding: spacing.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
});

export const CodeBlock = React.memo(CodeBlockComponent);

