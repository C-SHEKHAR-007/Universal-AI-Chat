import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import {
  Info,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { StreamingCursor } from './StreamingCursor';
import { CodeBlock } from './CodeBlock';
import { ThinkingProcessBlock } from './ThinkingProcessBlock';

export { StreamingCursor } from './StreamingCursor';
export { CodeBlock } from './CodeBlock';
export { ThinkingProcessBlock } from './ThinkingProcessBlock';

export interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser = false,
  isStreaming = false,
}) => {
  const { colors } = useTheme();

  // Parse inline markdown tokens (code, links, bold, italic, strikethrough)
  const renderInline = (text: string, baseStyle: any = {}): React.ReactNode => {
    if (!text) return null;

    // Pattern matching:
    // 1. Inline code: `...`
    // 2. Links: [...](...)
    // 3. Bold+Italic: ***...*** or ___...___
    // 4. Bold: **...** or __...__
    // 5. Strikethrough: ~~...~~
    // 6. Italic: *...* or _..._
    const inlineRegex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|(?<=\s|^)_[^_]+_(?=\s|$))/g;

    const segments: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        segments.push(
          <Text key={`txt_${lastIdx}`} style={baseStyle}>
            {text.slice(lastIdx, match.index)}
          </Text>
        );
      }

      const token = match[0];
      const tokenKey = `tok_${match.index}`;

      if (token.startsWith('`') && token.endsWith('`')) {
        // Inline code
        const code = token.slice(1, -1);
        segments.push(
          <Text
            key={tokenKey}
            style={[
              baseStyle,
              styles.inlineCode,
              {
                backgroundColor: colors.codeBg || 'rgba(120, 120, 120, 0.15)',
                color: colors.primary,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {code}
          </Text>
        );
      } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        // Link: [label](url)
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          segments.push(
            <Text
              key={tokenKey}
              style={[
                baseStyle,
                styles.linkText,
                { color: colors.primary, textDecorationColor: colors.primary },
              ]}
              onPress={() => {
                const targetUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')
                  ? url
                  : `https://${url}`;
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                } else {
                  Linking.openURL(targetUrl).catch(() => {});
                }
              }}
            >
              {label}
            </Text>
          );
        } else {
          segments.push(<Text key={tokenKey} style={baseStyle}>{token}</Text>);
        }
      } else if (
        (token.startsWith('***') && token.endsWith('***')) ||
        (token.startsWith('___') && token.endsWith('___'))
      ) {
        // Bold + Italic
        const inner = token.slice(3, -3);
        segments.push(
          <Text key={tokenKey} style={[baseStyle, { fontWeight: '700', fontStyle: 'italic' }]}>
            {inner}
          </Text>
        );
      } else if (
        (token.startsWith('**') && token.endsWith('**')) ||
        (token.startsWith('__') && token.endsWith('__'))
      ) {
        // Bold
        const inner = token.slice(2, -2);
        segments.push(
          <Text key={tokenKey} style={[baseStyle, { fontWeight: '700' }]}>
            {inner}
          </Text>
        );
      } else if (token.startsWith('~~') && token.endsWith('~~')) {
        // Strikethrough
        const inner = token.slice(2, -2);
        segments.push(
          <Text key={tokenKey} style={[baseStyle, { textDecorationLine: 'line-through' }]}>
            {inner}
          </Text>
        );
      } else if (
        (token.startsWith('*') && token.endsWith('*')) ||
        (token.startsWith('_') && token.endsWith('_'))
      ) {
        // Italic
        const inner = token.slice(1, -1);
        segments.push(
          <Text key={tokenKey} style={[baseStyle, { fontStyle: 'italic' }]}>
            {inner}
          </Text>
        );
      } else {
        segments.push(<Text key={tokenKey} style={baseStyle}>{token}</Text>);
      }

      lastIdx = match.index + token.length;
    }

    if (lastIdx < text.length) {
      segments.push(
        <Text key={`txt_end_${lastIdx}`} style={baseStyle}>
          {text.slice(lastIdx)}
        </Text>
      );
    }

    if (segments.length === 0) {
      return <Text style={baseStyle}>{text}</Text>;
    }

    return <Text>{segments}</Text>;
  };

  // Pre-process content for streaming: auto-close incomplete code blocks
  let parseableContent = content;
  const tripleBacktickCount = (content.match(/```/g) || []).length;
  if (tripleBacktickCount % 2 !== 0) {
    parseableContent = content + '\n```';
  }

  // Split by code blocks and remove empty segments so trailing parts are accurate
  const rawParts = parseableContent.split(/(```[\s\S]*?```)/g);
  const parts = rawParts.filter((p) => p.length > 0);

  return (
    <View style={styles.container}>
      {parts.map((part, pIdx) => {
        const isLastPart = pIdx === parts.length - 1;

        // 1. Code Block
        if (part.startsWith('```') && part.endsWith('```')) {
          const rawInner = part.slice(3, -3);
          const lines = rawInner.split('\n');
          const language = (lines[0] || '').trim();
          const codeText = lines.length > 1 ? lines.slice(1).join('\n') : '';

          return (
            <CodeBlock
              key={`code_${pIdx}`}
              code={codeText}
              language={language || 'code'}
              isStreaming={isStreaming && isLastPart}
            />
          );
        }

        // 2. Parse Line-by-Line & Blocks for non-code text
        const rawLines = part.split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        // Find index of the last non-empty line in this part
        let lastNonEmptyLineIdx = -1;
        for (let idx = rawLines.length - 1; idx >= 0; idx--) {
          if (rawLines[idx].trim()) {
            lastNonEmptyLineIdx = idx;
            break;
          }
        }

        while (i < rawLines.length) {
          const line = rawLines[i];
          const trimmed = line.trim();
          const isCurrentLast = isStreaming && isLastPart && i === lastNonEmptyLineIdx;

          // A. Blank line
          if (!trimmed) {
            elements.push(<View key={`sp_${pIdx}_${i}`} style={styles.paragraphGap} />);
            i++;
            continue;
          }

          // B. Horizontal Rule: ---, ***, ___, - - -, * * *
          if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
            elements.push(
              <View
                key={`hr_${pIdx}_${i}`}
                style={[styles.horizontalRule, { backgroundColor: colors.borderLight }]}
              />
            );
            i++;
            continue;
          }

          // C. Blockquote & Alerts (> ...)
          if (/^\s*>\s?/.test(line)) {
            const quoteLines: string[] = [];
            while (i < rawLines.length && /^\s*>\s?/.test(rawLines[i])) {
              quoteLines.push(rawLines[i].replace(/^\s*>\s?/, ''));
              i++;
            }

            const firstLine = quoteLines[0] || '';
            const alertMatch = firstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);

            if (alertMatch) {
              const alertType = alertMatch[1].toUpperCase();
              const remainingFirstLine = alertMatch[2];
              const alertBodyLines = remainingFirstLine
                ? [remainingFirstLine, ...quoteLines.slice(1)]
                : quoteLines.slice(1);

              let alertColor = colors.primary;
              let alertBg = colors.primaryMuted;
              let AlertIcon = Info;
              let alertLabel = 'Note';

              if (alertType === 'TIP') {
                alertColor = colors.success;
                alertBg = colors.cardHover;
                AlertIcon = Sparkles;
                alertLabel = 'Tip';
              } else if (alertType === 'IMPORTANT') {
                alertColor = colors.warning;
                alertBg = colors.cardHover;
                AlertIcon = AlertCircle;
                alertLabel = 'Important';
              } else if (alertType === 'WARNING') {
                alertColor = colors.warning;
                alertBg = colors.cardHover;
                AlertIcon = AlertTriangle;
                alertLabel = 'Warning';
              } else if (alertType === 'CAUTION') {
                alertColor = colors.danger;
                alertBg = colors.dangerMuted;
                AlertIcon = AlertCircle;
                alertLabel = 'Caution';
              }

              const isAlertAtEndOfPart = isStreaming && isLastPart && i > lastNonEmptyLineIdx;

              const isThinkingProcess =
                remainingFirstLine.trim().toLowerCase().includes('thinking') ||
                remainingFirstLine.trim().toLowerCase().includes('thought') ||
                alertType === 'THINKING';

              if (isThinkingProcess) {
                const thinkingBody = quoteLines.slice(1);
                elements.push(
                  <ThinkingProcessBlock
                    key={`think_${pIdx}_${i}`}
                    title={remainingFirstLine.trim() || 'Thinking Process'}
                    bodyLines={thinkingBody.length > 0 ? thinkingBody : ['...']}
                    isThinkingActive={isAlertAtEndOfPart}
                    renderInline={renderInline}
                  />
                );
                continue;
              }

              elements.push(
                <View
                  key={`alert_${pIdx}_${i}`}
                  style={[
                    styles.alertBox,
                    {
                      borderColor: alertColor,
                      backgroundColor: alertBg,
                    },
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <AlertIcon size={14} color={alertColor} />
                    <Text style={[styles.alertTitle, { color: alertColor }]}>
                      {alertLabel}
                    </Text>
                  </View>
                  {alertBodyLines.map((bLine, bIdx) => (
                    <Text
                      key={`ab_${bIdx}`}
                      style={[styles.alertText, { color: colors.textPrimary }]}
                    >
                      {renderInline(bLine, [styles.alertText, { color: colors.textPrimary }])}
                      {isAlertAtEndOfPart && bIdx === alertBodyLines.length - 1 && <StreamingCursor />}
                    </Text>
                  ))}
                </View>
              );
            } else {
              // Standard Blockquote
              const isBlockquoteAtEndOfPart = isStreaming && isLastPart && i > lastNonEmptyLineIdx;

              elements.push(
                <View
                  key={`bq_${pIdx}_${i}`}
                  style={[
                    styles.blockquote,
                    {
                      borderLeftColor: colors.primary,
                      backgroundColor: colors.cardHover,
                    },
                  ]}
                >
                  {quoteLines.map((qLine, qIdx) => (
                    <Text
                      key={`q_${qIdx}`}
                      style={[styles.blockquoteText, { color: colors.textSecondary }]}
                    >
                      {renderInline(qLine, [styles.blockquoteText, { color: colors.textSecondary }])}
                      {isBlockquoteAtEndOfPart && qIdx === quoteLines.length - 1 && <StreamingCursor />}
                    </Text>
                  ))}
                </View>
              );
            }
            continue;
          }

          // D. Markdown Table (| col1 | col2 |)
          if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length) {
            const nextTrimmed = rawLines[i + 1].trim();
            const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(nextTrimmed);

            if (isSeparator) {
              const tableLines: string[] = [];
              while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
                tableLines.push(rawLines[i].trim());
                i++;
              }

              const headerCells = tableLines[0]
                .slice(1, -1)
                .split('|')
                .map((c) => c.trim());

              const bodyRows = tableLines.slice(2).map((rowLine) =>
                rowLine
                  .slice(1, -1)
                  .split('|')
                  .map((c) => c.trim())
              );

              elements.push(
                <ScrollView
                  key={`tbl_${pIdx}_${i}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tableScroll}
                >
                  <View style={[styles.tableCard, { borderColor: colors.borderLight, backgroundColor: colors.card }]}>
                    {/* Header Row */}
                    <View style={[styles.tableHeaderRow, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.borderLight }]}>
                      {headerCells.map((h, hIdx) => (
                        <View key={`th_${hIdx}`} style={[styles.tableCell, { borderRightColor: colors.borderLight }]}>
                          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]}>
                            {renderInline(h, [styles.tableHeaderText, { color: colors.textPrimary }])}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {/* Body Rows */}
                    {bodyRows.map((row, rIdx) => (
                      <View
                        key={`tr_${rIdx}`}
                        style={[
                          styles.tableBodyRow,
                          {
                            borderBottomColor: colors.borderLight,
                            backgroundColor: rIdx % 2 === 1 ? colors.cardHover : 'transparent',
                          },
                        ]}
                      >
                        {row.map((cell, cIdx) => (
                          <View key={`td_${cIdx}`} style={[styles.tableCell, { borderRightColor: colors.borderLight }]}>
                            <Text style={[styles.tableCellText, { color: colors.textPrimary }]}>
                              {renderInline(cell, [styles.tableCellText, { color: colors.textPrimary }])}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              );
              continue;
            }
          }

          // E. Header (# to ######)
          const headerMatch = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
          if (headerMatch) {
            const level = headerMatch[2].length;
            const headerContent = headerMatch[3];
            const headerStyle =
              level === 1
                ? [styles.h1, { color: colors.textPrimary }]
                : level === 2
                ? [styles.h2, { color: colors.textPrimary }]
                : level === 3
                ? [styles.h3, { color: colors.textPrimary }]
                : [styles.h4, { color: colors.textPrimary }];

            elements.push(
              <Text key={`h_${pIdx}_${i}`} style={headerStyle}>
                {renderInline(headerContent, headerStyle)}
                {isCurrentLast && <StreamingCursor />}
              </Text>
            );
            i++;
            continue;
          }

          // F. List Item & Sub-points (supports *, -, +, and 1., 2.)
          const listMatch = line.match(/^(\s*)([*+-]|\d+\.)\s+(.*)$/);
          if (listMatch) {
            const indentSpaces = listMatch[1].length;
            const level = Math.min(Math.floor(indentSpaces / 2), 4);
            const marker = listMatch[2];
            const itemContent = listMatch[3];
            const isNumbered = /^\d+\.$/.test(marker);

            const baseStyle = isUser
              ? [styles.userText, { color: colors.userBubbleText }]
              : [styles.assistantText, { color: colors.textPrimary }];

            elements.push(
              <View
                key={`li_${pIdx}_${i}`}
                style={[
                  styles.listRow,
                  { paddingLeft: level * 18 },
                ]}
              >
                {isNumbered ? (
                  <Text style={[styles.listNumber, { color: colors.primary }]}>
                    {marker}
                  </Text>
                ) : (
                  <View style={styles.bulletWrapper}>
                    {level === 0 ? (
                      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                    ) : level === 1 ? (
                      <View style={[styles.bulletRing, { borderColor: colors.primary }]} />
                    ) : (
                      <View style={[styles.bulletSquare, { backgroundColor: colors.textSecondary }]} />
                    )}
                  </View>
                )}
                <Text style={[baseStyle, { flex: 1 }]}>
                  {renderInline(itemContent, baseStyle)}
                  {isCurrentLast && <StreamingCursor />}
                </Text>
              </View>
            );
            i++;
            continue;
          }

          // G. Regular Paragraph Text
          const baseStyle = isUser
            ? [styles.userText, { color: colors.userBubbleText }]
            : [styles.assistantText, { color: colors.textPrimary }];

          elements.push(
            <Text key={`p_${pIdx}_${i}`} style={[baseStyle, styles.paragraphText]}>
              {renderInline(line, baseStyle)}
              {isCurrentLast && <StreamingCursor />}
            </Text>
          );
          i++;
        }

        return <View key={`block_${pIdx}`}>{elements}</View>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inlineStreamingCursor: {
    fontSize: typography.size.md,
    fontWeight: '900',
    lineHeight: 22,
  },
  paragraphGap: {
    height: 8,
  },
  paragraphText: {
    marginVertical: 2,
    lineHeight: 22,
  },
  assistantText: {
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  userText: {
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  inlineCode: {
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    fontSize: 13.5,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  // Headers
  h1: {
    fontSize: 21,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 26,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 5,
    lineHeight: 23,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 21,
  },
  h4: {
    fontSize: 14.5,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 3,
    lineHeight: 19,
  },
  // Horizontal Rule
  horizontalRule: {
    height: 1,
    width: '100%',
    marginVertical: 14,
    opacity: 0.85,
  },
  // Blockquotes
  blockquote: {
    borderLeftWidth: 3.5,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
  },
  blockquoteText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Alerts / Callouts
  alertBox: {
    borderLeftWidth: 3.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  // Lists & Nested Sub-points
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2.5,
    gap: 8,
  },
  listNumber: {
    fontSize: typography.size.md,
    fontWeight: '600',
    minWidth: 18,
    lineHeight: 22,
  },
  bulletWrapper: {
    width: 14,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletRing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  bulletSquare: {
    width: 5,
    height: 5,
    borderRadius: 1,
  },
  // Tables
  tableScroll: {
    marginVertical: 8,
    width: '100%',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableCellText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
